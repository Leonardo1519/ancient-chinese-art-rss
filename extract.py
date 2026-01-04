import urllib.request, html
page = urllib.request.urlopen('https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/').read().decode('utf-8')
parts = page.split('<pre class="language-json"><code class="language-json">')
print(len(parts))
for part in parts[1:]:
    content = part.split('</code></pre>',1)[0]
    if 'data_collection_permissions' in content:
        print(html.unescape(content))
