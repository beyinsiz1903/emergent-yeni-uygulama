from types import SimpleNamespace


class InMemoryCursor:
    def __init__(self, items):
        self._items = list(items)

    def sort(self, key, direction):
        reverse = direction == -1
        self._items.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    def limit(self, value):
        if value is not None:
            self._items = self._items[:value]
        return self

    async def to_list(self, length):
        return self._items[:length]


class InMemoryCollection:
    def __init__(self, initial=None):
        self.documents = list(initial or [])

    async def insert_one(self, document):
        self.documents.append(document)
        return document

    async def insert_many(self, documents):
        self.documents.extend(documents)
        return documents

    async def count_documents(self, query):
        return sum(1 for doc in self.documents if self._matches(doc, query))

    async def find_one(self, query, projection=None):
        for doc in self.documents:
            if self._matches(doc, query):
                return self._project(doc, projection)
        return None

    def find(self, query, projection=None):
        items = [self._project(doc, projection) for doc in self.documents if self._matches(doc, query)]
        return InMemoryCursor(items)

    async def update_one(self, query, update):
        for doc in self.documents:
            if self._matches(doc, query):
                for operator, values in update.items():
                    if operator == "$set":
                        doc.update(values)
                    elif operator == "$inc":
                        for field, delta in values.items():
                            doc[field] = doc.get(field, 0) + delta
                return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)

    def _matches(self, document, query):
        for key, expected in query.items():
            value = document.get(key)
            if isinstance(expected, dict):
                for op, operand in expected.items():
                    if op == "$ne" and value == operand:
                        return False
                    if op in {"$lt", "$gt", "$lte", "$gte"} and value is None:
                        return False
                    if op == "$lt" and not (value < operand):
                        return False
                    if op == "$gt" and not (value > operand):
                        return False
                    if op == "$gte" and not (value >= operand):
                        return False
                    if op == "$lte" and not (value <= operand):
                        return False
                    if op == "$in" and value not in operand:
                        return False
            else:
                if value != expected:
                    return False
        return True

    @staticmethod
    def _project(document, projection):
        if not projection:
            return dict(document)
        result = dict(document)
        for field, include in projection.items():
            if include == 0:
                result.pop(field, None)
        return result


def build_in_memory_db(**collections):
    return SimpleNamespace(**collections)
