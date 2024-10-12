
import os


def store_message(html_text):
    # save to tmp/messages/{id}.html
    message_id = html_text.split('" dir=')[0].split('data-message-id="')[1]
    file_path = f'tmp/messages/{message_id}.html'
    # mkdir
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html_text)
    print(f'Saved message to: {file_path}')
