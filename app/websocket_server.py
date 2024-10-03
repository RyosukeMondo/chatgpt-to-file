# websocket_server.py

import asyncio
import websockets
import json
import os
import logging

# Configure logging
logging.basicConfig(
    filename='websocket_receiver.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def save_file(full_path, content):
    try:
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.debug(f'Created directory: {directory}')
        
        base, extension = os.path.splitext(full_path)
        counter = 1
        final_path = full_path

        # Avoid overwriting existing files
        while os.path.exists(final_path):
            final_path = f"{base}({counter}){extension}"
            counter += 1

        with open(final_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logging.info(f'File saved: {final_path}')
        return final_path
    except Exception as e:
        logging.error(f'Error saving file {full_path}: {e}')
        raise

async def handler(websocket, path):
    logging.info('Client connected.')
    try:
        async for message in websocket:
            logging.debug(f'Received message: {message}')
            try:
                data = json.loads(message)
                file_path = data.get('filePath')
                content = data.get('content')
                snippet_id = data.get('id')

                if file_path and content:
                    saved_path = await save_file(file_path, content)
                    response = {
                        'status': 'success',
                        'savedPath': saved_path,
                        'id': snippet_id
                    }
                else:
                    response = {
                        'status': 'error',
                        'message': 'Invalid message format.',
                        'id': snippet_id
                    }
                await websocket.send(json.dumps(response))
                logging.debug(f'Sent response: {response}')
            except json.JSONDecodeError:
                response = {
                    'status': 'error',
                    'message': 'Invalid JSON format.'
                }
                await websocket.send(json.dumps(response))
                logging.error('Invalid JSON format received.')
    except websockets.exceptions.ConnectionClosed as e:
        logging.info(f'Connection closed: {e}')

async def main():
    server = await websockets.serve(handler, 'localhost', 8765)
    logging.info('WebSocket server started on ws://localhost:8765')
    await server.wait_closed()

if __name__ == '__main__':
    asyncio.run(main())
