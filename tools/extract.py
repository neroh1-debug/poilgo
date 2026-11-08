# Renders image regions of the source PDF into public/img as webp.
import sys, io
import pymupdf as fitz
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
d = fitz.open(src)
S = 2
crops = {
 'p08': (8, 67,305,1221,766), 'p09': (9, 67,257,1277,787), 'p10': (10, 243,155,1197,692),
 'p12': (12, 0,0,1440,810), 'p13': (13, 0,0,1440,810), 'p14': (14, 0,0,1440,810),
 'p15': (15, 70,279,1089,787), 'p16': (16, 70,290,647,800), 'p17': (17, 70,307,1364,637),
 'p20a': (20, 45,297,712,741), 'p20b': (20, 712,297,1377,741),
 'p21': (21, 229,180,1247,752), 'p24': (24, 0,0,1440,810), 'p25': (25, 270,179,1095,763),
 'p26': (26, 70,247,1425,745), 'p28': (28, 80,269,1156,791), 'p29': (29, 67,264,1177,803),
 'p30a': (30, 90,220,576,785), 'p30b': (30, 745,270,1420,690),
 'p33': (33, 47,273,1107,786), 'p36': (36, 67,253,1171,773), 'p37': (37, 67,266,1111,779),
 'p38': (38, 0,0,1440,810), 'p39': (39, 0,0,1440,810),
 'quiz': (22, 95,95,445,195), 'o': (22, 582,527,718,722), 'x': (22, 718,527,858,722),
}
for name,(pg,x0,y0,x1,y1) in crops.items():
    pix = d[pg-1].get_pixmap(matrix=fitz.Matrix(S,S), clip=fitz.Rect(x0,y0,x1,y1), alpha=False)
    im = Image.open(io.BytesIO(pix.tobytes('png')))
    im.save(f'{out}/{name}.webp', 'WEBP', quality=86, method=5)
    print(name, im.size)
