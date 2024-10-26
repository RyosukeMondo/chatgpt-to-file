import subprocess
import logging


async def get_tracked_files(destination):
    try:
        result = subprocess.run(
            ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
            cwd=destination,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        tracked_files = result.stdout.splitlines()
        logging.debug(f'Tracked files: {tracked_files}')
        return tracked_files
    except Exception as e:
        logging.error(f'Error retrieving tracked files: {e}')
        return []
