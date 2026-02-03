"""
Storage Abstraction Layer
Base class for storage backends. Currently uses JSON files.
Designed to be swapped for a real database later.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
from threading import Lock


class BaseStorage(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    def get(self, key: str) -> Optional[Dict]:
        """Get a single item by key."""
        pass

    @abstractmethod
    def get_all(self) -> List[Dict]:
        """Get all items."""
        pass

    @abstractmethod
    def query(self, filters: Dict[str, Any]) -> List[Dict]:
        """Query items with filters."""
        pass

    @abstractmethod
    def create(self, data: Dict) -> Dict:
        """Create a new item."""
        pass

    @abstractmethod
    def update(self, key: str, data: Dict) -> Optional[Dict]:
        """Update an existing item."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete an item."""
        pass

    @abstractmethod
    def count(self, filters: Dict[str, Any] = None) -> int:
        """Count items, optionally with filters."""
        pass


class JSONFileStorage(BaseStorage):
    """JSON file-based storage implementation."""

    def __init__(self, file_path: str, id_field: str = 'id'):
        self.file_path = file_path
        self.id_field = id_field
        self._lock = Lock()
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        """Create file if it doesn't exist."""
        if not os.path.exists(self.file_path):
            dir_path = os.path.dirname(self.file_path)
            if dir_path and not os.path.exists(dir_path):
                os.makedirs(dir_path)
            with open(self.file_path, 'w') as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict]:
        """Read all data from file."""
        try:
            with open(self.file_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _write_data(self, data: List[Dict]):
        """Write all data to file."""
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)

    def get(self, key: str) -> Optional[Dict]:
        """Get a single item by key."""
        with self._lock:
            data = self._read_data()
            for item in data:
                if item.get(self.id_field) == key:
                    return item
            return None

    def get_all(self) -> List[Dict]:
        """Get all items."""
        with self._lock:
            return self._read_data()

    def query(self, filters: Dict[str, Any] = None) -> List[Dict]:
        """Query items with filters."""
        with self._lock:
            data = self._read_data()
            if not filters:
                return data

            result = []
            for item in data:
                match = True
                for key, value in filters.items():
                    if item.get(key) != value:
                        match = False
                        break
                if match:
                    result.append(item)
            return result

    def create(self, data: Dict) -> Dict:
        """Create a new item."""
        with self._lock:
            all_data = self._read_data()

            # Generate ID if not provided
            if self.id_field not in data:
                data[self.id_field] = str(int(datetime.now().timestamp() * 1000))

            # Add timestamps
            now = datetime.now().isoformat()
            if 'created_at' not in data:
                data['created_at'] = now
            if 'updated_at' not in data:
                data['updated_at'] = now

            all_data.append(data)
            self._write_data(all_data)
            return data

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        """Update an existing item."""
        with self._lock:
            all_data = self._read_data()
            for i, item in enumerate(all_data):
                if item.get(self.id_field) == key:
                    # Merge data
                    item.update(data)
                    item['updated_at'] = datetime.now().isoformat()
                    all_data[i] = item
                    self._write_data(all_data)
                    return item
            return None

    def delete(self, key: str) -> bool:
        """Delete an item."""
        with self._lock:
            all_data = self._read_data()
            initial_len = len(all_data)
            all_data = [item for item in all_data if item.get(self.id_field) != key]
            if len(all_data) < initial_len:
                self._write_data(all_data)
                return True
            return False

    def delete_all(self) -> int:
        """Delete all items. Returns count of deleted items."""
        with self._lock:
            all_data = self._read_data()
            count = len(all_data)
            self._write_data([])
            return count

    def count(self, filters: Dict[str, Any] = None) -> int:
        """Count items, optionally with filters."""
        return len(self.query(filters))

    def bulk_update(self, keys: List[str], data: Dict) -> int:
        """Update multiple items at once. Returns count of updated items."""
        with self._lock:
            all_data = self._read_data()
            updated_count = 0
            now = datetime.now().isoformat()

            for i, item in enumerate(all_data):
                if item.get(self.id_field) in keys:
                    item.update(data)
                    item['updated_at'] = now
                    all_data[i] = item
                    updated_count += 1

            if updated_count > 0:
                self._write_data(all_data)
            return updated_count
