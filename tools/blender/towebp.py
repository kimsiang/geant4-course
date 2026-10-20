import sys, glob, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(src + '/*.png')):
    k = os.path.basename(f)[:-4]
    im = Image.open(f).convert('RGB')
    im.save(f'{dst}/{k}.webp', quality=78, method=6)
    im.resize((800, 320), Image.LANCZOS).save(f'{dst}/{k}-800.webp', quality=76, method=6)
    w, h = im.size  # thumbnail: centre-right 2:1 crop
    c = im.crop((int(w*0.2), int(h*0.05), int(w*0.2)+int(h*0.9*2), int(h*0.95)))
    c.resize((224, 112), Image.LANCZOS).save(f'{dst}/{k}-th.webp', quality=74, method=6)
    print(k)
