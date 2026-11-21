"""Disposable database and real cookie authentication for API regression tests."""
import hashlib
import os
import tempfile
import unittest
from datetime import timedelta

TEST_DATA = tempfile.TemporaryDirectory(prefix='hadir-tests-')
os.environ['HADIR_DATA_DIR'] = TEST_DATA.name
os.environ['HADIR_ENV_FILE'] = os.path.join(TEST_DATA.name, 'no-env')

from fastapi import FastAPI
from fastapi.testclient import TestClient
from hadir.api import courses, profile, roster, students
from hadir.db import init_db, now, now_iso, tx

init_db()
app = FastAPI()
for module in (courses, profile, roster, students):
    app.include_router(module.router)


class ApiTest(unittest.TestCase):
    def setUp(self):
        with tx() as db:
            db.execute('DELETE FROM users')
            for uid in (1, 2):
                db.execute('INSERT INTO users (id,name,email,created_at) VALUES (?,?,?,?)',
                           (uid, f'Professor {uid}', f'test{uid}@example.test', now_iso()))
                db.execute('INSERT INTO auth_sessions VALUES (?,?,?)',
                           (hashlib.sha256(f'test-{uid}'.encode()).hexdigest(), uid,
                            (now() + timedelta(days=1)).isoformat()))
        self.client = TestClient(app)
        self.client.cookies.set('hadir_session', 'test-1')
        self.other = TestClient(app)
        self.other.cookies.set('hadir_session', 'test-2')
        self.addCleanup(self.client.close)
        self.addCleanup(self.other.close)

    def course(self, code='QA101', section='1'):
        body = dict(code=code, section=section, nameAr='مادة اختبار', nameEn='Test course', days=[0, 2])
        response = self.client.post('/api/courses', json=body)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['id'], body

    def student(self, course_id, number='123456'):
        body = dict(number=number, nameAr='طالب اختبار', nameEn='Test Student', major='IT', year=2, gender='m')
        response = self.client.post(f'/api/courses/{course_id}/students', json=body)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['id'], body
