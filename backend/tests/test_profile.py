import base64
import io
from PIL import Image
from fastapi.testclient import TestClient
from support import ApiTest, app
from hadir.api.pabbel_auth import link_account
from hadir.db import tx


def picture(size=(512, 512)):
    out = io.BytesIO()
    Image.new('RGB', size, 'red').save(out, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(out.getvalue()).decode()


class ProfileTest(ApiTest):
    def test_profile_updates_persist_and_pabbel_does_not_overwrite(self):
        body = dict(name='Updated Name', title='Professor', department='Computing', gender='f')
        with tx() as db:
            db.execute("UPDATE users SET pabbel_id='test-pabbel' WHERE id=1")
        r = self.client.patch('/api/profile', json=body)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['user']['name'], body['name'])
        self.assertNotIn('avatar', r.json()['user'])
        self.assertEqual(link_account('test-pabbel', 'test1@example.test', 'Pabbel Name', 'm'), 1)
        with tx() as db:
            row = db.execute('SELECT * FROM users WHERE id=1').fetchone()
            self.assertEqual(row['name'], body['name'])
            self.assertEqual(row['gender'], 'f')
            self.assertEqual(db.execute('SELECT name FROM users WHERE id=2').fetchone()['name'], 'Professor 2')
        self.assertEqual(self.client.patch('/api/profile', json={**body, 'name': '  '}).status_code, 422)

    def test_picture_upload_dimensions_private_access_and_reset(self):
        r = self.client.post('/api/profile/avatar', json={'image': picture()})
        self.assertEqual(r.status_code, 200, r.text)
        url = r.json()['user']['avatarUrl']
        image = self.client.get(url)
        self.assertEqual(image.status_code, 200)
        self.assertEqual(image.headers['content-type'], 'image/webp')
        self.assertEqual(image.headers['cache-control'], 'private, no-store')
        with Image.open(io.BytesIO(image.content)) as img:
            self.assertEqual(img.size, (512, 512))
            self.assertFalse(img.getexif())
        self.assertEqual(self.other.get(url).status_code, 404)
        with TestClient(app) as guest:
            self.assertEqual(guest.get(url).status_code, 401)
            self.assertEqual(guest.post('/api/profile/avatar', json={'image': picture()}).status_code, 401)
        reset = self.client.delete('/api/profile/avatar')
        self.assertEqual(reset.status_code, 200)
        self.assertIsNone(reset.json()['user']['avatarUrl'])
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_invalid_pictures_leave_previous_picture_intact(self):
        self.client.post('/api/profile/avatar', json={'image': picture((128, 128))})
        before = self.client.get('/api/profile/avatar').content
        for value in (picture((513, 512)), picture((512, 513)), 'data:image/svg+xml;base64,PHN2Zz4=',
                      'data:image/png;base64,not-base64!', 'data:image/png;base64,bm90IGFuIGltYWdl'):
            self.assertEqual(self.client.post('/api/profile/avatar', json={'image': value}).status_code, 422)
            self.assertEqual(self.client.get('/api/profile/avatar').content, before)
