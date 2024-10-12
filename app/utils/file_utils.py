import json
import os
import logging
from utils.git_utils import get_tracked_files


async def save_file(full_path, content, overwrite=True):
    try:
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.debug(f'Created directory: {directory}')
        
        base, extension = os.path.splitext(full_path)
        counter = 1
        final_path = full_path

        if not overwrite:
            # Avoid overwriting existing files
            while os.path.exists(final_path):
                final_path = f"{base}({counter}){extension}"
                counter += 1

        is_first_line_path_comment = (
            content.startswith('//') or
            content.startswith('#') or
            content.startswith('/*') or
            content.startswith('<!--'))
        if is_first_line_path_comment:
            # Remove the first line if it is a comment
            content = '\n'.join(content.split('\n')[1:])
            # and remove first blank line
            content = content.strip()

        with open(final_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logging.info(f'File saved: {final_path}')
        return final_path
    except Exception as e:
        logging.error(f'Error saving file {full_path}: {e}')
        return None


async def send_all_files(websocket, destination):
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
            if any(file.endswith(ext) for ext in ignore_exts):
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
            print("sent:", file_path)
            await websocket.send(json.dumps(message))
            logging.debug(f'Sent file content: {file_path}')
        except Exception as e:
            logging.error(f'Error sending file {file}: {e}')
