"""Config-handling regression tests (stdlib unittest, no DB connection).

Run from ``backend/``:  python -m unittest -v test_config
"""
import importlib
import os
import unittest


class ConfigTests(unittest.TestCase):
    def _reload(self):
        import config

        return importlib.reload(config)

    def test_no_hardcoded_password_default(self):
        os.environ.pop("DB_PASS", None)
        cfg = self._reload()
        self.assertEqual(cfg.DB_PASS, "", "DB_PASS must default to empty")

    def test_missing_password_raises_clear_error(self):
        os.environ["DB_PASS"] = ""
        cfg = self._reload()
        with self.assertRaises(cfg.ConfigError) as ctx:
            cfg.validate_db_password()
        self.assertIn("DB_PASS", str(ctx.exception))

    def test_url_uses_env_values_only(self):
        os.environ.update(
            DB_USER="u1", DB_PASS="p@ss-unittest", DB_HOST="h1",
            DB_PORT="3399", DB_NAME="db1",
        )
        cfg = self._reload()
        cfg.validate_db_password()  # must not raise
        self.assertEqual(
            cfg.DATABASE_URL, "mysql+pymysql://u1:p@ss-unittest@h1:3399/db1"
        )

    def tearDown(self):
        for key in ("DB_USER", "DB_PASS", "DB_HOST", "DB_PORT", "DB_NAME"):
            os.environ.pop(key, None)


if __name__ == "__main__":
    unittest.main()
