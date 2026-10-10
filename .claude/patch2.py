import sys,os
p=os.path.join(sys.argv[1],'PurchaseOrderManagement.tsx'); s=open(p,encoding='utf-8').read()
old='''    setSearchParams(prev => {
      const next = new URLSearchParams(prev);'''
new='''    // Read the live URL rather than the render-time params so quick successive updates don't overwrite each other.
    setSearchParams(() => {
      const next = new URLSearchParams(window.location.search);'''
assert old in s; open(p,'w',encoding='utf-8',newline='').write(s.replace(old,new,1)); print('ok')
