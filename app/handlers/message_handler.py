import json
import logging

from utils.file_utils import save_file, send_all_files
from managers.message_manager import store_message


async def handle_message(message, websocket):
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        logging.error('Invalid JSON format received.')
        return {
            'status': 'error',
            'message': 'Invalid JSON format.'
        }
    
    message_type = data.get('type')
    if message_type == 'SYNC':
        destination = data.get('destination')
        if destination:
            await send_all_files(websocket, destination)
            return None  # Responses are handled within send_all_files
        else:
            logging.error('SYNC message missing destination.')
            return {
                'status': 'error',
                'message': 'Missing destination in SYNC message.'
            }
    else:
        kind = data.get('kind')
        file_path = data.get('filePath')
        content = data.get('content')
        snippet_id = data.get('id')
        
        if kind == 'snippet' and snippet_id:
            if file_path and content:
                saved_path = await save_file(file_path, content)
                return {
                    'status': 'success',
                    'savedPath': saved_path,
                    'id': snippet_id
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Invalid message format.',
                    'id': snippet_id
                }
        elif kind == 'assistant':
            if content:
                store_message(content, snippet_id, file_path)
                return {
                    'status': 'success',
                    'content': content
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Invalid message format.'
                }
        else:
            logging.error('Unknown message type received.')
            return {
                'status': 'error',
                'message': 'Unknown message type.'
            }