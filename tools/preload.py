# Refresh preload.json (file hashes + version) after changing any template asset.
# Usage: python3 tools/preload.py            (keeps the current file list)
import json,os,hashlib
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'preload.json')))
out=[];H=hashlib.md5()
for e in man['files']:
    p=os.path.join(root,e['u'])
    if not os.path.isfile(p): print('missing',e['u']);continue
    b=open(p,'rb').read();h=hashlib.md5(b).hexdigest()[:10];H.update((e['u']+h).encode())
    n={'u':e['u'],'s':len(b),'h':h}
    if e.get('c'):n['c']=e['c']
    out.append(n)
v=H.hexdigest()[:10]
json.dump({'v':v,'files':out},open(os.path.join(root,'preload.json'),'w'),separators=(',',':'))
print('version',v,'files',len(out))
