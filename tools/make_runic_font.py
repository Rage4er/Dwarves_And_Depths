#!/usr/bin/env python3
# Генератор шрифта DeepGlyph (TTF) на чистом Python: угловатые "высеченные" штрихи
# по спеку (сетка 24×32, перекладины с наклоном, горизонталей нет).
# Выхлоп: public/fonts/runic-mine.ttf (400) и runic-mine-bold.ttf (700).

import struct
from datetime import datetime

UPEM = 1000
CAP = 700
DESC = -180

# ── Геометрия глифов (спек DeepGlyph) ─────────────────────────────
# Сетка 24×32, y ВНИЗ: T=2 (верх), M=16 (середина), B=30 (низ),
# L=2, C=12, R=22. Каждый глиф: (advance, strokes); stroke = (points, closed)
# — уже в шрифтовых единицах (y вверх, базовая линия y=0).

# Сетка DeepGlyph
T, M, B = 2, 16, 30
L, C, R = 2, 12, 22
BASELINE = B   # строка сетки, уходящая в базовую линию шрифта
SCALE = 25     # 1 ед. сетки = 25 ед. шрифта → высота знака 700

D = {}

def P(x, y):
    # координаты сетки (y вниз) → шрифтовые (y вверх)
    return (x * SCALE, (BASELINE - y) * SCALE)

def p(x, y):  # прямые шрифтовые единицы — для символов вне спека
    return (x, y)

def s(*pts):  # открытый штрих
    return (list(pts), False)

def crossbar(y):  # перекладина спека: левый конец y+1, правый y-1
    return s(P(L, y + 1), P(R, y - 1))

# Правило DeepGlyph: горизонталей нет. Прочие чистые горизонтали
# наклоняются под тем же углом, что crossbar (2 ед. на 20 → 0.1).
SLOPE_RATE = 0.1

def slant(strokes):
    out = []
    for pts, closed in strokes:
        if closed or len(pts) < 2:
            out.append((list(pts), closed))
            continue
        q = [list(pt) for pt in pts]
        for i in range(len(q) - 1):
            (x1, y1), (x2, y2) = q[i], q[i + 1]
            if y1 == y2 and x1 != x2:
                lo, hi = (i, i + 1) if x1 < x2 else (i + 1, i)
                dx = abs(x2 - x1)
                q[lo][1] -= SLOPE_RATE * dx / 2
                q[hi][1] += SLOPE_RATE * dx / 2
        out.append((tuple(tuple(pt) for pt in q), False))
    return out

def g(name, *strokes, adv=None):
    if adv is None:
        mx = max(pt[0] for pts, _closed in strokes for pt in pts)
        adv = int(mx + 2 * SCALE)
    D[name] = (adv, slant(list(strokes)))

# ── Латиница (спек DeepGlyph, unicase) ────────────────────────────
g('A', s(P(C,T),P(L,B)), s(P(C,T),P(R,B)), s(P(6,20),P(18,18)))
g('B', s(P(L,T),P(L,B)), s(P(L,T),P(R-4,T+3)), s(P(R-4,T+3),P(L,M)), s(P(L,M),P(R-4,M+3)), s(P(R-4,M+3),P(L,B)))
g('C', s(P(L,T+4),P(L,B-4)), s(P(L,T+4),P(R-6,T)), s(P(L,B-4),P(R-6,B)))
g('D', s(P(L,T),P(L,B)), s(P(L,T),P(R,M)), s(P(R,M),P(L,B)))
g('E', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+2)), s(P(L,M+1),P(R-6,M-1)), s(P(L,B),P(R,B-2)))
g('F', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+2)), s(P(L,M),P(R-6,M-1)))
g('G', s(P(L,T+4),P(L,B-4)), s(P(L,T+4),P(R-6,T)), s(P(L,B-4),P(R-6,B)), s(P(R-6,M),P(R-6,B-4)), s(P(R-6,M),P(C,M+1)))
g('H', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), crossbar(M))
g('I', s(P(C,T),P(C,B)))
g('J', s(P(R,T),P(R,B-6)), s(P(R,B-6),P(C,B)), s(P(C,B),P(L,B-6)))
g('K', s(P(L,T),P(L,B)), s(P(R,T),P(L,M)), s(P(L,M),P(R,B)))
g('L', s(P(L,T),P(L,B)), s(P(L,B),P(R,B-2)))
g('M', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(L,T),P(C,M)), s(P(C,M),P(R,T)))
g('N', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(L,T),P(R,B)))
g('O', s(P(L,T+4),P(L,B-4)), s(P(R,T+4),P(R,B-4)), s(P(L,T+4),P(C,T)), s(P(C,T),P(R,T+4)), s(P(L,B-4),P(C,B)), s(P(C,B),P(R,B-4)))
g('P', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+3)), s(P(R,T+3),P(L,M)))
g('Q', s(P(L,T+4),P(L,B-4)), s(P(R,T+4),P(R,B-4)), s(P(L,T+4),P(C,T)), s(P(C,T),P(R,T+4)), s(P(L,B-4),P(C,B)), s(P(C,B),P(R,B-4)), s(P(C,M),P(R,B)))
g('R', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+3)), s(P(R,T+3),P(L,M)), s(P(L,M),P(R,B)))
g('S', s(P(R,T),P(L,T+8)), s(P(L,T+8),P(R,M+4)), s(P(R,M+4),P(L,B)))
g('T', s(P(C,T),P(C,B)), crossbar(T))
g('U', s(P(L,T),P(L,B-6)), s(P(R,T),P(R,B-6)), s(P(L,B-6),P(C,B)), s(P(C,B),P(R,B-6)))
g('V', s(P(L,T),P(C,B)), s(P(R,T),P(C,B)))
g('W', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(L,T),P(C,M)), s(P(C,M),P(R,T)), s(P(C,M),P(C,B)))
g('X', s(P(L,T),P(R,B)), s(P(R,T),P(L,B)))
g('Y', s(P(L,T),P(C,M)), s(P(R,T),P(C,M)), s(P(C,M),P(C,B)))
g('Z', s(P(L,T),P(R,T)), s(P(R,T),P(L,B)), s(P(L,B),P(R,B)))

# ── Цифры ──
g('zero', s(P(L+2,T+4),P(L+2,B-4)), s(P(R-2,T+4),P(R-2,B-4)), s(P(L+2,T+4),P(C,T)), s(P(C,T),P(R-2,T+4)), s(P(L+2,B-4),P(C,B)), s(P(C,B),P(R-2,B-4)))
g('one', s(P(C,T),P(C,B)), s(P(L+6,T+8),P(C,T)))
g('two', s(P(L,T+6),P(C,T)), s(P(C,T),P(R,T+6)), s(P(R,T+6),P(L,B)), s(P(L,B),P(R,B)))
g('three', s(P(L,T+2),P(R-4,T+2)), s(P(R-4,T+2),P(C,M)), s(P(C,M),P(R-4,B-2)), s(P(R-4,B-2),P(L,B-2)))
g('four', s(P(L,T),P(L,M)), s(P(L,M),P(R,M)), s(P(R,T),P(R,B)))
g('five', s(P(L,T),P(R,T)), s(P(L,T),P(L,M)), s(P(L,M),P(R,M)), s(P(R,M),P(L,B)))
g('six', s(P(R,T),P(L,M)), s(P(L,M),P(L,B-4)), s(P(L,B-4),P(C,B)), s(P(C,B),P(R,B-4)), s(P(R,B-4),P(L,M)))
g('seven', s(P(L,T),P(R,T)), s(P(R,T),P(L,B)))
g('eight', s(P(L+2,T+4),P(L+2,M)), s(P(R-2,T+4),P(R-2,M)), s(P(L+2,T+4),P(C,T)), s(P(C,T),P(R-2,T+4)), s(P(L+2,M),P(C,M)), s(P(C,M),P(R-2,M)), s(P(L+2,M),P(L+2,B-4)), s(P(R-2,M),P(R-2,B-4)), s(P(L+2,B-4),P(C,B)), s(P(C,B),P(R-2,B-4)))
g('nine', s(P(L,B),P(R,M)), s(P(R,T+4),P(R,M)), s(P(R,T+4),P(C,T)), s(P(C,T),P(L,T+4)), s(P(L,T+4),P(R,M)))

# ── Пунктуация ──
g('period', s(P(C,B-2),P(C,B)))
g('comma', s(P(C,B-2),P(C-2,B)))
g('exclam', s(P(C,T),P(C,M+6)), s(P(C,B-2),P(C,B)))
g('question', s(P(L,T+4),P(C,T)), s(P(C,T),P(R,T+4)), s(P(R,T+4),P(C,M)), s(P(C,M),P(C,M+4)), s(P(C,B-2),P(C,B)))
g('hyphen', s(P(L+6,M),P(R-6,M)))
g('colon', s(P(C,T+8),P(C,T+12)), s(P(C,B-12),P(C,B-8)))
g('semicolon', s(P(C,T+8),P(C,T+12)), s(P(C,B-12),P(C-2,B-8)))
g('paren_l', s(P(C,T),P(C-6,M)), s(P(C-6,M),P(C,B)))
g('paren_r', s(P(C,T),P(C+6,M)), s(P(C+6,M),P(C,B)))
g('lbracket', s(P(L+8,T),P(L+8,B)), s(P(L+8,T),P(R-8,T)), s(P(L+8,B),P(R-8,B)))
g('rbracket', s(P(R-8,T),P(R-8,B)), s(P(R-8,T),P(L+8,T)), s(P(R-8,B),P(L+8,B)))
g('brace_l', s(P(C,T),P(C-4,T+4)), s(P(C-4,T+4),P(C-4,M-4)), s(P(C-4,M-4),P(C,M)), s(P(C,M),P(C-4,M+4)), s(P(C-4,M+4),P(C-4,B-4)), s(P(C-4,B-4),P(C,B)))
g('brace_r', s(P(C,T),P(C+4,T+4)), s(P(C+4,T+4),P(C+4,M-4)), s(P(C+4,M-4),P(C,M)), s(P(C,M),P(C+4,M+4)), s(P(C+4,M+4),P(C+4,B-4)), s(P(C+4,B-4),P(C,B)))
g('less', s(P(R,T+4),P(L,M)), s(P(L,M),P(R,B-4)))
g('greater', s(P(L,T+4),P(R,M)), s(P(R,M),P(L,B-4)))
g('equal', s(P(L+6,M-4),P(R-6,M-4)), s(P(L+6,M+4),P(R-6,M+4)))
g('plus', s(P(C,M-8),P(C,M+8)), s(P(L+6,M),P(R-6,M)))
g('asterisk', s(P(C,M-6),P(C,M+6)), s(P(L+6,M-6),P(R-6,M+6)), s(P(R-6,M-6),P(L+6,M+6)))
g('slash', s(P(L,B),P(R,T)))
g('backslash', s(P(L,T),P(R,B)))
g('underscore', s(P(L,B+2),P(R,B+2)))
g('quotesingle', s(P(C,T),P(C,T+6)))
g('quotedbl', s(P(C-4,T),P(C-4,T+6)), s(P(C+4,T),P(C+4,T+6)))
g('percent', s(P(L,B),P(R,T)), s(P(L+2,T),P(L+2,T+6)), s(P(L+2,T+6),P(L+6,T+6)), s(P(R-2,B-6),P(R-2,B)), s(P(R-6,B-6),P(R-2,B-6)))
g('ampersand', s(P(R,T),P(L,M)), s(P(L,M),P(R,B)), s(P(L,B),P(R,M)))
g('at', s(P(L,T+4),P(L,B-4)), s(P(L,T+4),P(C,T)), s(P(C,T),P(R,T+4)), s(P(R,T+4),P(R,M)), s(P(R,M),P(C,M+2)), s(P(C,M+2),P(C,B)))

# ── Доп. символы вне спека (шрифтовые единицы, y вверх) ───────────
g('guillemet_l', s(p(300,430),p(170,330),p(300,230)), s(p(440,430),p(310,330),p(440,230)))
g('guillemet_r', s(p(180,430),p(310,330),p(180,230)), s(p(40,430),p(170,330),p(40,230)))
g('emdash', s(p(60,330),p(640,330)))
g('endash', s(p(50,330),p(450,330)))
g('bullet', s(p(170,350)))

# ── Кириллица (спек DeepGlyph, unicase) ───────────────────────────
g('Acyr', s(P(C,T),P(L,B)), s(P(C,T),P(R,B)), s(P(6,20),P(18,18)))
g('Be', s(P(L,T),P(L,B)), s(P(L,T),P(R-4,T+3)), s(P(R-4,T+3),P(L,M)), s(P(L,M),P(R-4,M+3)), s(P(R-4,M+3),P(L,B)))
g('Ve', s(P(L,T),P(L,B)), s(P(L,T),P(R-4,T+3)), s(P(R-4,T+3),P(L,M)), s(P(L,M),P(R-4,M+3)), s(P(R-4,M+3),P(L,B)))
g('Ghe', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+2)))
g('De', s(P(C,T),P(C,B-4)), s(P(L,B-4),P(R,B-4)), s(P(L,B-4),P(L,B)), s(P(R,B-4),P(R,B)))
g('Ie', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+2)), s(P(L,M+1),P(R-6,M-1)), s(P(L,B),P(R,B-2)))
g('Io', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+2)), s(P(L,M+1),P(R-6,M-1)), s(P(L,B),P(R,B-2)), s(P(7,T),P(9,T)), s(P(15,T),P(17,T)))
g('Zhe', s(P(C,T),P(C,B)), s(P(L,T),P(C,M)), s(P(C,M),P(L,B)), s(P(R,T),P(C,M)), s(P(C,M),P(R,B)))
g('Ze', s(P(L,T),P(R-6,T+3)), s(P(R-6,T+3),P(C,M)), s(P(C,M),P(R-6,B-3)), s(P(R-6,B-3),P(L,B)))
g('Icyr', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(R,T),P(L,B)))
g('Ishort', s(P(L,T+2),P(L,B)), s(P(R,T+2),P(R,B)), s(P(R,T+2),P(L,B)), s(P(8,T-2),P(C,T)), s(P(C,T),P(16,T-2)))
g('Ka', s(P(L,T),P(L,B)), s(P(R,T),P(L,M)), s(P(L,M),P(R,B)))
g('El', s(P(L,T),P(C,T)), s(P(R,T),P(R,B)), s(P(L,T),P(L,B)))
g('Em', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(L,T),P(C,M)), s(P(C,M),P(R,T)))
g('En', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), crossbar(M))
g('Ocyr', s(P(L,T+4),P(L,B-4)), s(P(R,T+4),P(R,B-4)), s(P(L,T+4),P(C,T)), s(P(C,T),P(R,T+4)), s(P(L,B-4),P(C,B)), s(P(C,B),P(R,B-4)))
g('Pe', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), crossbar(T))
g('Er', s(P(L,T),P(L,B)), s(P(L,T),P(R,T+3)), s(P(R,T+3),P(L,M)))
g('Es', s(P(L,T+4),P(L,B-4)), s(P(L,T+4),P(R-6,T)), s(P(L,B-4),P(R-6,B)))
g('Te', s(P(C,T),P(C,B)), crossbar(T))
g('Ucyr', s(P(L,T),P(C,M)), s(P(R,T),P(C,M)), s(P(C,M),P(C,B)))
g('Ef', s(P(C,T),P(C,B)), s(P(L+4,T+8),P(L+4,B-8)), s(P(R-4,T+8),P(R-4,B-8)), s(P(L+4,T+8),P(C,T+8)), s(P(C,T+8),P(R-4,T+8)), s(P(L+4,B-8),P(C,B-8)), s(P(C,B-8),P(R-4,B-8)))
g('Ha', s(P(L,T),P(R,B)), s(P(R,T),P(L,B)))
g('Tse', s(P(L,T),P(L,B-2)), s(P(R,T),P(R,B-2)), crossbar(B-2), s(P(R,B-2),P(R+2,B+2)))
g('Che', s(P(L,T),P(L,M)), s(P(R,T),P(R,B)), crossbar(M))
g('Sha', s(P(L,T),P(L,B)), s(P(C,T),P(C,B)), s(P(R,T),P(R,B)), s(P(L,B),P(R,B)))
g('Shcha', s(P(L,T),P(L,B-2)), s(P(C,T),P(C,B-2)), s(P(R,T),P(R,B-2)), s(P(L,B-2),P(R,B-2)), s(P(R,B-2),P(R+2,B+2)))
g('Hardsign', s(P(L,T),P(C,T)), s(P(C,T),P(C,B)), crossbar(M), s(P(R,M),P(C,B)))
g('Yeru', s(P(L,T),P(L,B)), s(P(R,T),P(R,B)), s(P(L,M),P(R-8,M)), s(P(R-8,M),P(L,B)))
g('Softsign', s(P(L,T),P(L,B)), s(P(L,M),P(R,M)), s(P(R,M),P(L,B)))
g('Erev', s(P(R,T+4),P(R,B-4)), s(P(R,T+4),P(L+8,T)), s(P(R,B-4),P(L+8,B)), s(P(R,M),P(C,M)))
g('Yu', s(P(L,T),P(L,B)), s(P(R,T+4),P(R,B-4)), crossbar(M), s(P(R,T+4),P(R+6,T)), s(P(R,B-4),P(R+6,B)))
g('Ya', s(P(R,T),P(R,B)), s(P(R,T),P(L,T)), s(P(L,T),P(C,M)), s(P(C,M),P(L,B)))

CHAR_MAP = {}
for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    CHAR_MAP[ch] = ch
for ch in 'abcdefghijklmnopqrstuvwxyz':
    CHAR_MAP[ch] = ch.upper()
for ch, name in [('А','Acyr'),('Б','Be'),('В','Ve'),('Г','Ghe'),('Д','De'),('Е','Ie'),('Ё','Io'),
                 ('Ж','Zhe'),('З','Ze'),('И','Icyr'),('Й','Ishort'),('К','Ka'),('Л','El'),('М','Em'),
                 ('Н','En'),('О','Ocyr'),('П','Pe'),('Р','Er'),('С','Es'),('Т','Te'),('У','Ucyr'),
                 ('Ф','Ef'),('Х','Ha'),('Ц','Tse'),('Ч','Che'),('Ш','Sha'),('Щ','Shcha'),
                 ('Ъ','Hardsign'),('Ы','Yeru'),('Ь','Softsign'),('Э','Erev'),('Ю','Yu'),('Я','Ya')]:
    CHAR_MAP[ch] = name
for ch in 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя':
    CHAR_MAP[ch] = CHAR_MAP[ch.upper()]
for ch, name in [('0','zero'),('1','one'),('2','two'),('3','three'),('4','four'),('5','five'),
                 ('6','six'),('7','seven'),('8','eight'),('9','nine'),
                 ('.','period'),(',','comma'),(':','colon'),(';','semicolon'),('!','exclam'),
                 ('?','question'),('-','hyphen'),('—','emdash'),('–','endash'),("'","quotesingle"),
                 ('"','quotedbl'),('«','guillemet_l'),('»','guillemet_r'),('%','percent'),
                 ('+','plus'),('=','equal'),('*','asterisk'),('/','slash'),('\\','backslash'),
                 ('(','paren_l'),(')','paren_r'),('[','lbracket'),(']','rbracket'),('·','bullet'),
                 ('{','brace_l'),('}','brace_r'),('<','less'),('>','greater'),('_','underscore'),
                 ('&','ampersand'),('@','at')]:
    CHAR_MAP[ch] = name
CHAR_MAP[' '] = None  # пробел — пустой глиф

# ── Построение контуров штрихов ───────────────────────────────────

def sub(a, b): return (a[0]-b[0], a[1]-b[1])
def add(a, b): return (a[0]+b[0], a[1]+b[1])
def mul(a, k): return (a[0]*k, a[1]*k)
def nrm(a):
    l = (a[0]**2 + a[1]**2) ** 0.5
    return (0.0, 0.0) if l == 0 else (a[0]/l, a[1]/l)
def perp(a): return (-a[1], a[0])
def dot(a, b): return a[0]*b[0] + a[1]*b[1]

def outline_stroke(pts, closed, h):
    pts = [q for i, q in enumerate(pts) if i == 0 or q != pts[i-1]]
    if closed and len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) == 1:
        x, y = pts[0]
        return [[(int(x-h), int(y-h)), (int(x+h), int(y-h)), (int(x+h), int(y+h)), (int(x-h), int(y+h))]]
    n = len(pts)
    L, R = [], []
    for i in range(n):
        if closed:
            prv, cur, nxt = pts[(i-1) % n], pts[i], pts[(i+1) % n]
            d1, d2 = nrm(sub(cur, prv)), nrm(sub(nxt, cur))
        elif i == 0:
            d1 = d2 = nrm(sub(pts[1], pts[0])); cur = pts[0]
        elif i == n-1:
            d1 = d2 = nrm(sub(pts[-1], pts[-2])); cur = pts[-1]
        else:
            d1 = nrm(sub(pts[i], pts[i-1])); d2 = nrm(sub(pts[i+1], pts[i])); cur = pts[i]
        bis = nrm(add(d1, d2))
        if bis == (0.0, 0.0):
            bis = d1
        cos_half = abs(dot(bis, d1))
        off = h / max(0.45, cos_half)
        off = min(off, 2.2 * h)
        pv = perp(bis)
        L.append((round(cur[0] + pv[0] * off), round(cur[1] + pv[1] * off)))
        R.append((round(cur[0] - pv[0] * off), round(cur[1] - pv[1] * off)))
    if closed:
        return [L, list(reversed(R))]
    return [L + list(reversed(R))]

def signed_area(poly):
    a = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i+1) % len(poly)]
        a += x1*y2 - x2*y1
    return a / 2

def fix_winding(contours):
    # TrueType: внешний контур — по часовой (отрицательная площадь), дыра — против.
    out = []
    for idx, poly in enumerate(contours):
        area = signed_area(poly)
        want_negative = (idx == 0)
        if (area < 0) != want_negative:
            poly = list(reversed(poly))
        out.append(poly)
    return out

# ── TTF-сериализация ──────────────────────────────────────────────

EPOCH_1904 = int((datetime(2026, 1, 1) - datetime(1904, 1, 1)).total_seconds())

def build_glyph(char, h):
    name = CHAR_MAP.get(char)
    if name is None:
        return None, None  # пробел
    advance, strokes = D[name]
    contours = []
    for pts, closed in strokes:
        contours.extend(outline_stroke(pts, closed, h))
    contours = fix_winding(contours)
    contours = [poly for poly in contours if len(poly) >= 3]
    return advance, contours

def glyf_bytes(contours):
    if not contours:
        return b''
    allpts = [q for poly in contours for q in poly]
    xmin = min(q[0] for q in allpts); xmax = max(q[0] for q in allpts)
    ymin = min(q[1] for q in allpts); ymax = max(q[1] for q in allpts)
    buf = struct.pack('>hhhhh', len(contours), xmin, ymin, xmax, ymax)
    idx = 0
    for poly in contours:
        idx += len(poly)
        buf += struct.pack('>H', idx - 1)
    buf += struct.pack('>H', 0)
    # флаги: bit0 on-curve = 1, без X_SHORT/Y_SHORT/SAME → координаты int16
    flags = b''
    for _ in allpts:
        flags += b'\x01'
    px = py = 0
    xs = b''; ys = b''
    for q in allpts:
        dx, dy = q[0] - px, q[1] - py
        xs += struct.pack('>h', dx); ys += struct.pack('>h', dy)
        px, py = q
    return buf + flags + xs + ys

def cmap_format4(chars_sorted):
    # gid = позиция в chars_sorted + 1 (0 = .notdef)
    segs = []
    start = 0
    for i in range(1, len(chars_sorted) + 1):
        if i == len(chars_sorted) or ord(chars_sorted[i]) != ord(chars_sorted[i-1]) + 1:
            c0 = ord(chars_sorted[start])
            segs.append((c0, ord(chars_sorted[i-1]), (start + 1 - c0) % 65536))
            start = i
    segs.append((0xFFFF, 0xFFFF, 1))
    n = len(segs)
    sr = 2 * (2 ** (n.bit_length() - 1))
    es = (n.bit_length() - 1)
    endcodes = b''.join(struct.pack('>H', e[1]) for e in segs)
    startcodes = b''.join(struct.pack('>H', e[0]) for e in segs)
    deltas = b''.join(struct.pack('>H', e[2]) for e in segs)
    ranges = b''.join(struct.pack('>H', 0) for _ in segs)
    length = 16 + 8 * n
    body = struct.pack('>HHHHHHH', 4, length, 0, n * 2, sr, es, 2 * n - sr)
    body += endcodes + struct.pack('>H', 0) + startcodes + deltas + ranges
    return body, segs

def make_name_table(family, subfamily):
    full = f'{family} {subfamily}'
    ps = family.replace(' ', '') + '-' + subfamily
    recs = [(1, family), (2, subfamily), (4, full), (6, ps)]
    entries = []
    strings = b''
    for nid, val in recs:
        s_utf16 = val.encode('utf-16-be')
        s_ascii = val.encode('latin-1', 'replace')
        for (pid, eid, lang, sdata) in [(3, 1, 0x409, s_utf16), (1, 0, 0, s_ascii)]:
            entries.append((pid, eid, lang, nid, len(sdata), len(strings)))
            strings += sdata
    storage = 6 + 12 * len(entries)
    header = struct.pack('>HHH', 0, len(entries), storage)
    body = b''.join(
        struct.pack('>HHHHHH', pid, eid, lang, nid, ln, storage + off)
        for (pid, eid, lang, nid, ln, off) in entries
    )
    return header + body + strings

def build_font(path, family, subfamily, weight, h):
    chars = sorted(c for c in CHAR_MAP if CHAR_MAP[c] is not None and ord(c) < 0xFFFE)
    num = len(chars) + 1

    glyfs = [b'']  # .notdef
    advs = [300]
    for ch in chars:
        adv, contours = build_glyph(ch, h)
        glyfs.append(glyf_bytes(contours))
        advs.append(adv if adv else 300)

    # loca / glyf
    loca = [0]
    gbuf = b''
    for gb in glyfs:
        gbuf += gb
        if len(gbuf) % 4:
            gbuf += b'\x00' * (4 - len(gbuf) % 4)
        loca.append(len(gbuf))

    npts = sum(len([q for poly in [c for c in []]]) for c in [])
    max_points = 0
    max_contours = 0
    for gb in glyfs[1:]:
        if not gb: continue
        nc = struct.unpack('>h', gb[0:2])[0]
        max_contours = max(max_contours, nc)
        ep = struct.unpack('>H', gb[10 + 2*nc - 2:10 + 2*nc])[0] + 1
        max_points = max(max_points, ep)

    xmin = min([0] + [struct.unpack('>h', gb[2:4])[0] for gb in glyfs[1:] if gb])
    ymin = min([0] + [struct.unpack('>h', gb[4:6])[0] for gb in glyfs[1:] if gb])
    xmax = max([0] + [struct.unpack('>h', gb[6:8])[0] for gb in glyfs[1:] if gb])
    ymax = max([0] + [struct.unpack('>h', gb[8:10])[0] for gb in glyfs[1:] if gb])

    # hmtx
    hmtx = b''.join(struct.pack('>HH', a, 0) for a in advs)
    # пересчёт lsb
    hmtx = b''
    for i, gb in enumerate(glyfs):
        lsb = struct.unpack('>h', gb[2:4])[0] if gb else 0
        hmtx += struct.pack('>Hh', advs[i], lsb)

    cmap_body, _segs = cmap_format4(chars)
    cmap = struct.pack('>HHHHI', 0, 1, 3, 1, 12) + cmap_body[0:2] + b'\x00\x00' + cmap_body[2:]
    # формат subtable: platformID, encID, offset — я собрал вручную выше; проще пересобрать:
    sub = cmap_body  # начинается с format,length,language...
    cmap = struct.pack('>HHHHI', 0, 1, 3, 1, 12) + sub

    head = struct.pack(
        '>IIIIHHQQhhhhHHhhh',
        0x00010000, 0x00010000, 0, 0x5F0F3CF5, 0x000B, UPEM,
        EPOCH_1904, EPOCH_1904,
        xmin, ymin, xmax, ymax,
        1 if weight >= 700 else 0, 8, 2, 1, 0,
    )
    assert len(head) == 54, len(head)

    awmax = max(advs)
    hhea = struct.pack(
        '>IhhhHhhhhhhhhhhhH',
        0x00010000, 820, -220, 100, awmax,
        xmin, 0, xmax,
        1, 0, 0, 0, 0, 0, 0, 0, num,
    )
    assert len(hhea) == 36, len(hhea)

    maxp = struct.pack('>I' + 'H' * 14, 0x00010000, num, max_points, max_contours,
                       0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0)
    assert len(maxp) == 32, len(maxp)

    post = struct.pack('>IihhIIIII', 0x00030000, 0, -100, 40, 0, 0, 0, 0, 0)
    assert len(post) == 32, len(post)

    name_t = make_name_table(family, subfamily)

    fs_sel = 0x20 if weight >= 700 else 0x40
    os2 = struct.pack(
        '>HHHHH' + 'hhhhhhhh' + 'hh' + 'h' + '10B' + 'IIII' + '4s' + 'HHHhhhHH' + 'II' + 'HHHHH',
        4, 500, weight, 5, 0,
        650, 600, 0, 75, 650, 600, 0, -75, 50, 260,
        0,
        2, 11, 6, 3, 2, 2, 2, 2, 2, 4,
        0x00000003, 1 << 9, 0, 0,
        b'RUNI',
        fs_sel, min(ord(c) for c in chars), max(ord(c) for c in chars),
        820, -220, 100, 850, 250,
        0x0007, 0,
        520, CAP, 0, 32, 1,
    )
    assert len(os2) == 96, len(os2)

    tables = {
        b'OS/2': os2, b'cmap': cmap, b'glyf': gbuf, b'head': head,
        b'hhea': hhea, b'hmtx': hmtx, b'loca': struct.pack(f'>{len(loca)}I', *loca),
        b'maxp': maxp, b'name': name_t, b'post': post,
    }

    ntab = len(tables)
    sr = 16 * (2 ** (ntab.bit_length() - 1))
    es = ntab.bit_length() - 1
    rs = 16 * ntab - sr
    header = struct.pack('>IHHHH', 0x00010000, ntab, sr, es, rs)

    offset = 12 + 16 * ntab
    dirent = b''
    body = b''
    for tag in sorted(tables):
        data = tables[tag]
        pad = (4 - len(data) % 4) % 4
        cs = checksum(data + b'\x00' * pad)
        dirent += struct.pack('>4sIII', tag, cs, offset, len(data))
        body += data + b'\x00' * pad
        offset += len(data) + pad

    font = header + dirent + body
    # checkSumAdjustment
    total = checksum(font[:8] + b'\x00\x00\x00\x00' + font[12:])
    adj = (0xB1B0AFBA - total) % (1 << 32)
    font = font[:8] + struct.pack('>I', adj) + font[12:]

    with open(path, 'wb') as f:
        f.write(font)
    print(f'{path}: {len(font)} bytes, glyphs={num}, maxPoints={max_points}')
    return font

def checksum(data):
    data = data + b'\x00' * ((4 - len(data) % 4) % 4)
    s = 0
    for i in range(0, len(data), 4):
        s = (s + struct.unpack('>I', data[i:i+4])[0]) % (1 << 32)
    return s

# ── Валидация: парсим шрифт обратно ───────────────────────────────

def validate(path, sample_chars):
    data = open(path, 'rb').read()
    ver, ntab = struct.unpack('>IH', data[0:6])
    assert ver == 0x00010000, 'bad sfnt version'
    tables = {}
    for i in range(ntab):
        tag, cs, off, ln = struct.unpack('>4sIII', data[12 + 16*i:28 + 16*i])
        tables[tag.decode()] = (off, ln, cs)
    need = {'head', 'hhea', 'maxp', 'hmtx', 'cmap', 'glyf', 'loca', 'name', 'post', 'OS/2'}
    missing = need - set(tables)
    assert not missing, f'missing tables: {missing}'
    off, ln, cs = tables['glyf']
    assert checksum(data[off:off + ln]) == cs, 'glyf checksum mismatch'
    hoff = tables['head'][0]
    magic = struct.unpack('>I', data[hoff + 12:hoff + 16])[0]
    assert magic == 0x5F0F3CF5, 'bad head magic'
    adj = struct.unpack('>I', data[8:12])[0]
    tot = checksum(data[:8] + b'\x00\x00\x00\x00' + data[12:])
    assert (0xB1B0AFBA - tot) % (1 << 32) == adj, 'checkSumAdjustment mismatch'
    # loca monotonic
    loff = tables['loca'][0]
    n = struct.unpack('>H', data[tables['maxp'][0] + 4:tables['maxp'][0] + 6])[0]
    prev = -1
    for i in range(n + 1):
        v = struct.unpack('>I', data[loff + 4*i:loff + 4*i + 4])[0]
        assert v >= prev, 'loca not monotonic'
        prev = v
    # cmap: ищем коды
    coff = tables['cmap'][0]
    nsub = struct.unpack('>H', data[coff + 2:coff + 4])[0]
    soff = coff + struct.unpack('>I', data[coff + 8:coff + 12])[0]
    assert struct.unpack('>H', data[soff:soff + 2])[0] == 4, 'not format 4'
    segx2 = struct.unpack('>H', data[soff + 6:soff + 8])[0]
    segs = segx2 // 2
    base = soff + 14
    found = 0
    for ch in sample_chars:
        code = ord(ch)
        for si in range(segs):
            end = struct.unpack('>H', data[base + 2*si:base + 2*si + 2])[0]
            if end < code:
                continue
            start = struct.unpack('>H', data[base + segs*2 + 2 + 2*si:base + segs*2 + 4 + 2*si])[0]
            if start > code:
                break
            delta = struct.unpack('>h', data[base + segs*4 + 2 + 2*si:base + segs*4 + 4 + 2*si])[0]
            gid = (code + delta) % 65536
            assert gid > 0, f'{ch}: gid 0'
            found += 1
            break
    # name: family
    noff = tables['name'][0]
    cnt = struct.unpack('>H', data[noff + 2:noff + 4])[0]
    fam = None
    for i in range(cnt):
        pid, eid, _lang, nid, ln2, o2 = struct.unpack('>HHHHHH', data[noff + 6 + 12*i:noff + 18 + 12*i])
        if pid == 3 and nid == 1:
            so = noff + o2
            fam = data[so:so + ln2].decode('utf-16-be')
    print(f'validate {path}: OK, cmap samples found={found}, family={fam!r}')
    return True

if __name__ == '__main__':
    import os
    os.makedirs('public/fonts', exist_ok=True)
    samples = ['Г', 'Н', 'О', 'М', 'Ы', 'И', 'A', 'b', 'z', '5', '!', '«', 'Э', 'Д', 'ф']
    f1 = build_font('public/fonts/runic-mine.ttf', 'Runic Mine', 'Regular', 400, 46)
    f2 = build_font('public/fonts/runic-mine-bold.ttf', 'Runic Mine', 'Bold', 700, 62)
    validate('public/fonts/runic-mine.ttf', samples)
    validate('public/fonts/runic-mine-bold.ttf', samples)
    print('DONE')
