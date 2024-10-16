import os
import streamlit as st
import re


def write_code_snippets(parsed_json):
    """
    Walk through content items in the parsed JSON.
    If the code is complete and includes a path, create the file and write to the path.
    """
    message = parsed_json.get('message', {})
    path = message.get('path', '')
    content = message.get('content', {})
    items = content.get('items', [])

    if not items:
        st.warning("No content items found to apply.")
        return

    success_count = 0
    failure_count = 0
    for item in items:
        if item.get('type') == 'code_snippet':
            is_complete = item.get('is_complete_code', False)
            include_full_path = item.get('include_full_path', False)
            code = item.get('code', '')

            if not include_full_path:
                pattern = r"(#|//|/\*|<!--) ((\w+/)*\w+\.\w+)"
                replacement = f"\\1 Path: {path}\\2"
                code = re.sub(pattern, replacement, code)

            if is_complete:
                # Extract the path from the first line comment
                lines = code.splitlines()
                if lines:
                    if ("# " in lines[0] or  # Shell, Bash, PowerShell
                            "// " in lines[0] or  # Python, JavaScript
                            "/*" in lines[0] or  # C, C++, Java
                            "<!--" in lines[0]):
                        path_comment = lines[0]
                    if ("// " in lines[1] or  # Python, JavaScript
                            "<!--" in lines[1]):  # HTML, XML
                        path_comment = lines[1]

                    file_path = path_comment.split('Path:')[1].strip()
                    if not include_full_path and not os.path.exists(file_path):
                        st.warning(f"fail to guess file_path: {file_path}")
                        continue
                    if file_path:
                        try:
                            # Ensure the directory exists
                            os.makedirs(os.path.dirname(file_path), exist_ok=True)

                            # Write the code to the file
                            with open(file_path, 'w', encoding='utf-8') as f:
                                # Include the path as a comment in the file content
                                f.write(f"# {file_path}\n")
                                f.write('\n'.join(lines[1:]))  # Exclude the path comment

                            success_count += 1
                            st.success(f"Successfully wrote to {file_path}")
                        except Exception as e:
                            failure_count += 1
                            st.error(f"Failed to write to {file_path}: {e}")
                    else:
                        failure_count += 1
                        st.error("File path is missing in the code snippet.")
                else:
                    failure_count += 1
                    st.error("Code snippet does not include a valid path comment.")
            else:
                st.info("Skipping incomplete code snippet or missing path information.")

    st.info(f"Code application completed: {success_count} succeeded, {failure_count} failed.")
