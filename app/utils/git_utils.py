import subprocess
import logging
import tempfile
import os


async def get_tracked_files(destination):
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_file_path = tmp_file.name
            subprocess.run(
                ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
                cwd=destination,
                stdout=tmp_file,
                text=True,
                encoding='utf-8'
            )

        with open(tmp_file_path, 'r', encoding='utf-8') as file:
            tracked_files = file.read().splitlines()

        os.remove(tmp_file_path)

        logging.debug(f'Tracked files: {tracked_files}')
        return tracked_files
    except Exception as e:
        logging.error(f'Error retrieving tracked files: {e}')
        return []
