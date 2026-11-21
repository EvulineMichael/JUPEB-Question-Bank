"""Move questions whose topic label doesn't match a syllabus topic (courseStructure in
script.js) onto the right syllabus topic, so they show up when browsing by topic.
Run 2026-11-20. Safe to re-run: it only changes labels still using an old name.
Backup: backups-folder/before-topic-relabel-2026-11-20/"""
import json, os, sys

MAP = {
  'chemistry': {
    'Ideal Gases': 'Kinetic Molecular Theory of Gases',
    'Chemical Reactions': 'Ionic Equilibria',
    'States of Matter': 'Nature of Matter',
    'Organic Chemistry': 'Structure and Bonding in Organic Compounds',
    'Equilibrium': 'Equilibrium State',
    'Industrial Chemistry': 'p-block elements',
    'Acid-Base Chemistry': 'Acid-Base Equilibria',
    'Redox Chemistry': 'Electrochemistry',
    'Corrosion': 'Electrochemistry',
  },
  'physics': {'Electromagnetic Waves': 'Waves'},
  'maths': {
    "Newton's Laws and Forces": 'Newtonian Mechanics',
    'Work, Energy and Power': 'Newtonian Mechanics',
    'Equilibrium of a Rigid Body': 'Equilibrium of Rigid Bodies',
    'Moments of Inertia': 'Equilibrium of Rigid Bodies',
    'Friction': 'Forces and Equilibrium',
    'Ordinary Differential Equations': 'First Order Differential Equations',
    'Indices': 'Logarithms',
    'Binary Operations': 'Mappings',
    'Number Systems': 'Real Numbers',
    'Parametric Equations': 'Differentiation',
    'Partial Differentiation': 'Differentiation',
    'Curve Sketching': 'Applications of Differentiation',
    'Statistics': 'Introduction to Statistics',
    'Probability Distributions': 'Random Variables',
    'Sampling': 'Significance Testing',
    'Sampling Distribution': 'Significance Testing',
    't-Distribution': 'Significance Testing',
    'Confidence Interval': 'Significance Testing',
    'Compound Interest': 'Mathematics of Finance',
    'Annuities': 'Mathematics of Finance',
    'Depreciation': 'Mathematics of Finance',
    'Inventory': 'Mathematics of Finance',
    'Cost Functions': 'Production and Cost Functions',
    'Elasticity of Demand': 'Marginal Concepts',
    'Demand and Supply': 'Consumer and Producer Surplus',
    'Market Equilibrium': 'Consumer and Producer Surplus',
    'Application of Integral Calculus to Business': 'Consumer and Producer Surplus',
    'Profit Maximization': 'Optimization',
  },
  'biology': {
    'Biological Molecules': 'Living Things in Nature and Biological Molecules',
    'Cell Structure and Functions': 'Cell Organisation, Structure and Functions',
    'Cell Division, Genetics, Variations and Heredity': 'Cell Division, Principles of Genetics, Variations and Heredity',
    'Excretion': 'Physiological Processes',
    'Skeletal System and Muscles': 'Physiological Processes',
    'Respiration in Mammals': 'Physiological Processes',
    'Reproduction': 'Physiological Processes',
    'Nutrition in Animals': 'Physiological Processes',
    'Circulatory System': 'Physiological Processes',
    'Growth and Development': 'Physiological Processes',
    'Sense Organs': 'Sense Organ',
  },
  'government': {
    'Constitution & Constitutionalism': 'Constitution and Constitutionalism',
    'Governance & Citizenship': 'Governance and Citizenship',
    'Political Ideas & Thoughts': 'Political Ideas and Thoughts',
    'Elections & Electoral System': 'Elections and Electoral System',
    'The State, Structure & Types of Government': 'The State, Structure and Types of Government',
    'Political Parties, Party System & Pressure Groups': 'Political Parties, Party System and Pressure Groups',
    'Public Opinion & Propaganda': 'Public Opinion and Propaganda',
    'Elections & Electoral Process in Nigeria': 'Elections and Electoral Process in Nigeria',
    'Democratization & Political Process in Africa': 'Democratization and Political Process in Africa',
  },
  'crs': {
    'Formation & Composition of the Old Testament': 'Formation and Composition of the Old Testament',
    'The Divided Kingdoms & The Exiles': 'The Divided Kingdoms and the Exiles',
    'Mosaic Authorship of the Pentateuch: An Overview': 'Mosaic Authorship of the Pentateuch',
    'The Synopsis, Materials & Canonization of the New Testament': 'The Synopsis, Materials and Canonization of the New Testament',
    'Literature & Theology of the Synoptic Gospels': 'Literature and Theology of the Synoptic Gospels',
    'The Synoptic Gospels & The Synoptic Problem': 'The Synoptic Gospels and the Synoptic Problem',
    'Religious Personality & Human Values': 'Religious Personality and Human Values',
    'Relationship Between Religion & Society': 'Relationship Between Religion and Society',
    'Religion, Peace & Conflict Resolution': 'Religion, Peace and Conflict Resolution',
    'An Overview of the Previous Attempts at Christianizing Africa': 'Previous Attempts at Christianizing Africa',
  },
  'literature': {
    'Introduction': 'Introduction to Drama',                       # IJMB: both are drama questions
    'Nature of Government and Politics': 'Introduction to Literature',   # literary criticism questions
  },
  'irs': {'Introduction to the Study of Hadith': 'Definition and Values of Hadith'},
}

dry = '--dry' in sys.argv
total = 0
for subject, mapping in MAP.items():
    for root in (f'data/{subject}', f'data/ijmb/{subject}'):
        if not os.path.isdir(root):
            continue
        for name in sorted(os.listdir(root)):
            if not name.endswith('.json'):
                continue
            path = os.path.join(root, name)
            text = open(path, encoding='utf-8').read()
            new = text
            for old, target in mapping.items():
                for sep in ('": "', '":"'):
                    needle = f'"category{sep}{json.dumps(old, ensure_ascii=False)[1:-1]}"'
                    n = new.count(needle)
                    if n:
                        new = new.replace(needle, f'"category{sep}{json.dumps(target, ensure_ascii=False)[1:-1]}"')
                        total += n
            if new != text:
                json.loads(new)   # still valid JSON
                if not dry:
                    open(path, 'w', encoding='utf-8').write(new)
print(('would change' if dry else 'changed'), total, 'question labels')
