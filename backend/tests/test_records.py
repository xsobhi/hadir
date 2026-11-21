from support import ApiTest
from hadir.db import now_iso, tx


class RecordsTest(ApiTest):
    def test_courses_create_update_duplicate_and_ownership(self):
        cid, body = self.course()
        self.assertEqual(self.client.post('/api/courses', json=body).status_code, 409)
        self.assertEqual(self.client.post('/api/courses', json={**body, 'code': ' qa101 ', 'section': ' 1 '}).status_code, 409)
        second, other_body = self.course('QA102')
        self.assertEqual(self.client.patch(f'/api/courses/{second}', json=body).status_code, 409)
        self.assertEqual(self.client.get(f'/api/courses/{second}').json()['course']['code'], 'QA102')
        updated = {**body, 'nameAr': 'المادة الجديدة', 'days': [1, 1, 3], 'code': 'edit101'}
        self.assertEqual(self.client.patch(f'/api/courses/{cid}', json=updated).status_code, 200)
        course = self.client.get(f'/api/courses/{cid}').json()['course']
        self.assertEqual(course['code'], 'EDIT101')
        self.assertEqual(course['days'], [1, 3])
        for method in ('get', 'patch', 'delete'):
            args = {'json': body} if method == 'patch' else {}
            self.assertEqual(getattr(self.other, method)(f'/api/courses/{cid}', **args).status_code, 404)
        self.assertEqual(self.client.delete(f'/api/courses/{cid}').status_code, 200)
        self.assertEqual(self.client.get(f'/api/courses/{cid}').status_code, 404)

    def test_invalid_courses_do_not_create_rows(self):
        _, body = self.course()
        for changes in ({'code': '  '}, {'nameAr': '  '}, {'days': []}, {'days': [8]}, {'startTime': '25:00'}):
            self.assertEqual(self.client.post('/api/courses', json={**body, **changes}).status_code, 422)
        self.assertEqual(len(self.client.get('/api/courses').json()['courses']), 1)

    def test_student_edit_preserves_history_across_courses(self):
        cid, _ = self.course()
        second, _ = self.course('QA102')
        sid, body = self.student(cid)
        same, _ = self.student(second)
        self.assertEqual(sid, same)
        with tx() as db:
            session = db.execute("INSERT INTO class_sessions(course_id,starts_at,status) VALUES (?,?,'closed')", (cid, now_iso())).lastrowid
            db.execute("INSERT INTO attendance VALUES (?,?,'present',?,'manual','')", (session, sid, now_iso()))
        update = {**body, 'number': '654-321', 'nameAr': 'الاسم المعدل', 'year': 4}
        self.assertEqual(self.client.patch(f'/api/students/{sid}', json=update).status_code, 200)
        record = self.client.get(f'/api/students/{sid}').json()
        self.assertEqual(record['student']['number'], '654321')
        self.assertEqual(record['student']['nameAr'], update['nameAr'])
        self.assertEqual(len(record['courses']), 2)
        self.assertEqual(record['courses'][0]['history'][0]['status'], 'present')
        self.assertEqual(self.client.get(f'/api/courses/{second}').json()['students'][0]['number'], '654321')
        for method in ('get', 'patch', 'delete'):
            args = {'json': update} if method == 'patch' else {}
            self.assertEqual(getattr(self.other, method)(f'/api/students/{sid}', **args).status_code, 404)

    def test_student_duplicates_invalid_and_missing(self):
        cid, _ = self.course()
        sid, body = self.student(cid)
        self.student(cid, '999999')
        r = self.client.patch(f'/api/students/{sid}', json={**body, 'number': '999-999'})
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()['detail'], 'student_number_exists')
        for changes in ({'number': '---'}, {'nameAr': '  '}, {'year': 8}, {'gender': 'x'}):
            self.assertEqual(self.client.patch(f'/api/students/{sid}', json={**body, **changes}).status_code, 422)
        self.assertEqual(self.client.get(f'/api/students/{sid}').json()['student']['number'], body['number'])
        self.assertEqual(self.client.patch('/api/students/999999', json=body).status_code, 404)
        self.assertEqual(self.client.delete('/api/students/999999').status_code, 404)

    def test_student_delete_cascades_only_that_student(self):
        cid, _ = self.course()
        sid, _ = self.student(cid)
        keep, _ = self.student(cid, '999999')
        with tx() as db:
            session = db.execute("INSERT INTO class_sessions(course_id,starts_at,status) VALUES (?,?,'closed')", (cid, now_iso())).lastrowid
            for student in (sid, keep):
                db.execute("INSERT INTO attendance VALUES (?,?,'absent',?,'manual','')", (session, student, now_iso()))
                db.execute("INSERT INTO notices(owner_id,student_id,course_id,level,body,created_at) VALUES (1,?,?,'watch','test',?)", (student, cid, now_iso()))
        self.assertEqual(self.client.delete(f'/api/students/{sid}').status_code, 200)
        with tx() as db:
            for table in ('enrollments', 'attendance', 'notices'):
                self.assertEqual(db.execute(f'SELECT count(*) AS n FROM {table} WHERE student_id=?', (sid,)).fetchone()['n'], 0)
                self.assertEqual(db.execute(f'SELECT count(*) AS n FROM {table} WHERE student_id=?', (keep,)).fetchone()['n'], 1)
        self.assertEqual(self.client.get(f'/api/students/{keep}').status_code, 200)

    def test_deleting_course_keeps_students_available(self):
        cid, _ = self.course()
        sid, _ = self.student(cid)
        self.assertEqual(self.client.delete(f'/api/courses/{cid}').status_code, 200)
        listing = self.client.get('/api/students').json()
        self.assertEqual(listing['rows'], [])
        self.assertEqual(listing['unenrolled'][0]['id'], sid)
        self.assertEqual(self.client.get(f'/api/students/{sid}').status_code, 200)
