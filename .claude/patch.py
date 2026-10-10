import sys,os
root=sys.argv[1]
def rep(p,old,new):
    p=os.path.join(root,p); s=open(p,encoding='utf-8').read(); assert old in s,(p,old); open(p,'w',encoding='utf-8',newline='').write(s.replace(old,new,1))
rep('purchase-orders/POFormDrawer.tsx','className="sm:max-w-3xl p-0','className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-3xl p-0')
rep('purchase-orders/poModel.ts',"if (status === 'partially_received') return LIFECYCLE.findIndex(s => s.status === 'acknowledged');","if (status === 'partially_received') return LIFECYCLE.findIndex(s => s.status === 'received');")
print('ok')
