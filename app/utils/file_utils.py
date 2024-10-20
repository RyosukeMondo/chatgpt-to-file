import json
import os
import logging
import re
from app.utils.git_utils import get_tracked_files
from app.utils.handlers import get_handler_for_extension

logging.basicConfig(level=logging.INFO)


async def save_file(full_path, content, overwrite=True):
    """
    Saves the content to the specified full_path. If the content starts with a path comment,
    it extracts the actual path and saves the content accordingly.

    Args:
        full_path (str): The desired full file path.
        content (str): The content to save.
        overwrite (bool): Whether to overwrite the file if it exists.

    Returns:
        str | None: The path where the file was saved or None if an error occurred.
    """
    try:
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.debug(f'Created directory: {directory}')

        detected_extension = detect_extension(content)
        handler = get_handler_for_extension(detected_extension.lower())
        if not handler:
            logging.error(f"No handler found for extension: {detected_extension}")
            return None

        # Process content using the handler
        processed_content, final_path = handler.process_content(content, full_path, overwrite)
        if not final_path:
            logging.error(f"Failed to determine final path for file: {full_path}")
            return None

        with open(final_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logging.info(f'File saved: {final_path}')
        return final_path
    except Exception as e:
        logging.error(f'Error saving file {full_path}: {e}')
        return None


def detect_extension(content):
    # search first 5 lines of content.
    # find looks like .\w+\s or $
    # ex. <!-- abc.html -->, # abc.py, // abc.js, <!-- abc.css -->
    for line in content.splitlines()[:5]:
        if match := re.search(r'\.\w+\s|\.\w+$', line):
            return match.group().strip()


async def send_all_files(websocket, destination):
    """
    Sends all tracked files' contents over the websocket, excluding binary files.

    Args:
        websocket: The websocket connection.
        destination (str): The directory to scan for tracked files.
    """
    tracked_files = await get_tracked_files(destination)

    # Define binary file extensions to ignore
    ignore_exts = [
        '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.pdf',
        '.mp4', '.avi', '.mov', '.mp3', '.wav', '.zip', '.tar', '.gz',
        '.7z', '.rar', '.exe', '.dll', '.so', '.a', '.lib', '.o', '.obj',
        '.class', '.jar', '.war', '.ear', '.swf', '.flv', '.psd', '.ai',
        '.eps', '.ttf', '.woff', '.woff2', '.eot', '.otf', '.db', '.sqlite',
        '.sqlite3', '.db3', '.sql', '.bak', '.log', '.tmp', '.temp',
        '.cache', '.bak', '.backup', '.old', '.swp', '.swo', '.swn'
    ]

    for file in tracked_files:
        try:
            if any(file.lower().endswith(ext) for ext in ignore_exts):
                continue
            file_path = os.path.join(destination, file)
            if not os.path.isfile(file_path):
                continue
            if not os.path.exists(file_path):
                logging.error(f'File not found: {file_path}')
                continue
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            message = {
                'type': 'FILE_CONTENT',
                'filePath': file_path,
                'content': content
            }
            logging.info("sent:", file_path)
            await websocket.send(json.dumps(message))
            logging.debug(f'Sent file content: {file_path}')
        except Exception as e:
            logging.error(f'Error sending file {file}: {e}')
