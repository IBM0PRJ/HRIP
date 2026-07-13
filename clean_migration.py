import re

filepath = "alembic/versions/d916336157dd_phase2_risk.py"
with open(filepath, "r") as f:
    content = f.read()

content = re.sub(r"    op\.alter_column\([^)]+\)\n", "", content)

with open(filepath, "w") as f:
    f.write(content)
