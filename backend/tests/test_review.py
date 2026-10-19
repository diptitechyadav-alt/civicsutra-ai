import urllib.request
import urllib.error
import json

def test_duplicate_actions():
    # 1. Login as Admin
    login_data = json.dumps({'email': 'admin@civicsutra.org', 'password': 'Admin@123'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['token']

    # 2. Test Keep as Independent Issue (CONFIRM_DIFFERENT) with frontend camelCase payload
    diff_payload = json.dumps({
        'reportId': 'CS-2026-1003',
        'matchingReportId': 'CS-2026-1001',
        'action': 'CONFIRM_DIFFERENT',
        'reviewerNotes': 'Independent road hazard test note'
    }).encode()
    req_diff = urllib.request.Request(
        'http://127.0.0.1:8000/api/duplicates/review',
        data=diff_payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_diff) as resp_diff:
        assert resp_diff.status == 200
        result_diff = json.loads(resp_diff.read().decode())
        print('1. CONFIRM_DIFFERENT status:', result_diff['status'])
        assert result_diff['status'] == 'CONFIRMED_DIFFERENT_ISSUE'

    # Verify duplicate suggestion review_status in DB
    with urllib.request.urlopen('http://127.0.0.1:8000/api/duplicates') as dups_res:
        dups = json.loads(dups_res.read().decode())
        item = next(d for d in dups if d['reportId'] == 'CS-2026-1003' and d['matchingReportId'] == 'CS-2026-1001')
        assert item['status'] == 'CONFIRMED_DIFFERENT_ISSUE'
        print('   Verified in duplicate list: Status is', item['status'])

    # 3. Test Confirm Cluster Association (CONFIRM_SAME) with frontend camelCase payload
    same_payload = json.dumps({
        'reportId': 'CS-2026-1003',
        'matchingReportId': 'CS-2026-1001',
        'action': 'CONFIRM_SAME',
        'reviewerNotes': 'Ground team confirmed same underlying road defect'
    }).encode()
    req_same = urllib.request.Request(
        'http://127.0.0.1:8000/api/duplicates/review',
        data=same_payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_same) as resp_same:
        assert resp_same.status == 200
        result_same = json.loads(resp_same.read().decode())
        print('2. CONFIRM_SAME status:', result_same['status'], '| Cluster ID:', result_same.get('cluster_id'))
        assert result_same['status'] == 'CONFIRMED_SAME_ISSUE'
        assert result_same['cluster_id'] is not None

    # Verify cluster reports and report status
    cid = result_same["cluster_id"]
    with urllib.request.urlopen(f'http://127.0.0.1:8000/api/clusters/{cid}') as clus_res:
        clus_data = json.loads(clus_res.read().decode())
        print('   Cluster report count:', clus_data['cluster']['reportCount'])
        assert 'CS-2026-1003' in clus_data['reportIds']
        print('   CS-2026-1003 verified as cluster member!')

    # 4. Verify no duplicate cluster on re-confirming same action
    with urllib.request.urlopen(req_same) as resp_repeat:
        assert resp_repeat.status == 200
        result_repeat = json.loads(resp_repeat.read().decode())
        assert result_repeat['cluster_id'] == result_same['cluster_id']
        print('3. Re-confirming same pair returns existing cluster without duplicate cluster creation: OK')

    # 5. Verify citizen is blocked from calling /api/duplicates/review (403)
    login_cit = json.dumps({'email': 'citizen@civicsutra.org', 'password': 'Citizen@123'}).encode()
    req_c = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=login_cit, headers={'Content-Type': 'application/json'})
    token_c = json.loads(urllib.request.urlopen(req_c).read())['token']

    req_cit_review = urllib.request.Request(
        'http://127.0.0.1:8000/api/duplicates/review',
        data=same_payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token_c}'}
    )
    try:
        urllib.request.urlopen(req_cit_review)
        assert False, 'Citizen should be forbidden'
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print('4. Citizen role blocked on /api/duplicates/review (HTTP 403): OK')

    print('\nALL DUPLICATE ACTION TESTS PASSED SUCCESSFULLY!')

if __name__ == '__main__':
    test_duplicate_actions()
