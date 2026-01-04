#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Firefox Plugin Package Builder
Creates a ZIP file with correct forward slashes for Mozilla validation
"""

import os
import sys
import zipfile
from pathlib import Path

def create_firefox_package():
    """Create Firefox plugin package with correct path separators"""
    
    print("Creating Firefox plugin package...")
    
    # Output filename
    output_file = "ancient-chinese-art-rss-firefox.zip"
    
    # Remove old package
    if os.path.exists(output_file):
        os.remove(output_file)
        print("   Removed old package")
    
    # Files to include
    files_to_include = [
        "manifest.json",
        "icons/icon16.png",
        "icons/icon48.png",
        "icons/icon128.png",
        "src/background-firefox.js",
        "src/browser-polyfill-mini.js",
        "src/popup.html",
        "src/popup.js",
        "src/popup.css",
        "src/newtab.html",
        "src/newtab.js",
        "src/styles.css",
    ]
    
    # Check if all files exist
    missing = []
    for file_path in files_to_include:
        if not os.path.exists(file_path):
            missing.append(file_path)
    
    if missing:
        print("ERROR: Missing files:")
        for f in missing:
            print("   - " + f)
        return False
    
    # Create ZIP with forward slashes
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in files_to_include:
            # Use forward slashes for archive path (Unix style)
            archive_path = file_path.replace('\\', '/')
            zipf.write(file_path, archive_path)
            print("   Added: " + archive_path)
    
    # Get file size
    file_size = os.path.getsize(output_file)
    size_kb = file_size / 1024
    
    print("")
    print("SUCCESS!")
    print("   Package: " + output_file)
    print("   Size: {:.2f} KB".format(size_kb))
    print("")
    print("Ready to upload to:")
    print("   https://addons.mozilla.org/developers/addon/submit/distribution")
    
    return True

if __name__ == "__main__":
    success = create_firefox_package()
    sys.exit(0 if success else 1)
