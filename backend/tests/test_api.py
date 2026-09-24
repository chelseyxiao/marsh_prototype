from io import BytesIO

import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.parsers.excel import normalize_premium_value, normalize_wholesaler_name

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'service': 'rocky-api'}


def test_create_and_get_deal() -> None:
    response = client.post('/api/deals', json={'name': 'ABC Brokerage Acquisition', 'template': 'marsh'})
    assert response.status_code == 200
    payload = response.json()
    assert payload['name'] == 'ABC Brokerage Acquisition'
    assert payload['status'] == 'draft'

    deal_id = payload['id']
    get_response = client.get(f'/api/deals/{deal_id}')
    assert get_response.status_code == 200
    assert get_response.json()['id'] == deal_id


def test_missing_deal_returns_404() -> None:
    response = client.get('/api/deals/missing-deal-id')
    assert response.status_code == 404
    assert 'Deal not found' in response.json()['detail']


def test_upload_multiple_files() -> None:
    create_response = client.post('/api/deals', json={'name': 'Upload Test', 'template': 'marsh'})
    deal_id = create_response.json()['id']

    response = client.post(
        f'/api/deals/{deal_id}/documents',
        files=[
            ('files', ('Revenue.xlsx', b'content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
            ('files', ('Producer.pdf', b'content', 'application/pdf')),
        ],
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {item['filename'] for item in data} == {'Revenue.xlsx', 'Producer.pdf'} or len({item['filename'] for item in data}) == 2


def test_unsupported_file_upload() -> None:
    create_response = client.post('/api/deals', json={'name': 'Invalid Upload', 'template': 'marsh'})
    deal_id = create_response.json()['id']

    response = client.post(
        f'/api/deals/{deal_id}/documents',
        files=[('files', ('notes.txt', b'bad', 'text/plain'))],
    )

    assert response.status_code == 400
    assert 'Unsupported file type' in response.json()['detail']


def test_process_deal_requires_documents() -> None:
    create_response = client.post('/api/deals', json={'name': 'No Docs Deal', 'template': 'marsh'})
    deal_id = create_response.json()['id']

    response = client.post(f'/api/deals/{deal_id}/process')
    assert response.status_code == 400
    assert 'No documents uploaded' in response.json()['detail']


def test_process_deal_with_documents_and_get_results() -> None:
    create_response = client.post('/api/deals', json={'name': 'Process Deal', 'template': 'marsh'})
    deal_id = create_response.json()['id']

    client.post(
        f'/api/deals/{deal_id}/documents',
        files=[('files', ('Revenue.xlsx', b'content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))],
    )

    process_response = client.post(f'/api/deals/{deal_id}/process')
    assert process_response.status_code == 200
    body = process_response.json()
    assert body['deal_id'] == deal_id
    assert body['status'] == 'review'
    assert body['total_fields'] > 0

    list_response = client.get(f'/api/deals/{deal_id}/results')
    assert list_response.status_code == 200
    results = list_response.json()
    assert len(results) > 0
    assert results[0]['deal_id'] == deal_id


def test_update_mapping() -> None:
    create_response = client.post('/api/deals', json={'name': 'Review Deal', 'template': 'marsh'})
    deal_id = create_response.json()['id']
    client.post(
        f'/api/deals/{deal_id}/documents',
        files=[('files', ('Revenue.xlsx', b'content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))],
    )
    client.post(f'/api/deals/{deal_id}/process')

    mapping_id = client.get(f'/api/deals/{deal_id}/results').json()[0]['id']
    response = client.patch(
        f'/api/mappings/{mapping_id}',
        json={'status': 'corrected', 'proposed_value': 625000, 'reviewer_note': 'Updated based on supporting schedule.'},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'corrected'
    assert payload['proposed_value'] == 625000
    assert payload['reviewer_note'] == 'Updated based on supporting schedule.'


def test_wholesaler_analysis_upload_success() -> None:
    buffer = BytesIO()
    frame = pd.DataFrame(
        [
            {'Wholesaler': ' ARC ', 'Premium': '$100,000'},
            {'Wholesaler': 'ARC', 'Premium': ' 50,000 '},
            {'Wholesaler': 'RT', 'Premium': '$13,125'},
            {'Wholesaler': '  RT ', 'Premium': 'bad'},
            {'Wholesaler': 'Element', 'Premium': 25000},
            {'Wholesaler': '', 'Premium': 1000},
        ],
    )
    frame.to_excel(buffer, index=False)
    buffer.seek(0)

    response = client.post(
        '/api/analytics/wholesalers',
        files=[('file', ('brokerage.xlsx', buffer.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['row_count'] == 6
    assert payload['valid_premium_rows'] == 4
    assert payload['invalid_premium_rows'] == 1
    assert payload['unique_wholesalers'] == 3
    assert payload['total_premium'] == 188125.0
    assert payload['top_wholesalers'][0]['wholesaler'] == 'ARC'
    assert payload['top_wholesalers'][0]['total_premium'] == 150000.0


def test_wholesaler_analysis_missing_columns() -> None:
    buffer = BytesIO()
    pd.DataFrame({'Insured': ['A'], 'Coverage': ['B']}).to_excel(buffer, index=False)
    buffer.seek(0)

    response = client.post(
        '/api/analytics/wholesalers',
        files=[('file', ('missing.xlsx', buffer.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))],
    )

    assert response.status_code == 400
    assert "Required column 'Wholesaler' was not found." in response.json()['detail']


def test_wholesaler_and_premium_normalization() -> None:
    assert normalize_wholesaler_name(' ARC\u00a0') == 'ARC'
    assert normalize_wholesaler_name('  RT  Brokerage ') == 'RT Brokerage'
    assert normalize_premium_value('$100,000') == 100000.0
    assert normalize_premium_value('  13,125 ') == 13125.0
    assert normalize_premium_value('bad') is None
