#!/usr/env python
import json
import sys

responseText = "".join([line.strip() for line in sys.stdin])

try:
    response = json.loads();
    print response['data']['id']
except:
    exit(-1)
