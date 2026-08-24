import math
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional

@dataclass
class HandPoint:
    """3D point for hand landmarks."""
    x: float
    y: float
    z: float
    
    def to_pixel(self, width: int, height: int) -> Tuple[int, int]:
        return (int(self.x * width), int(self.y * height))
    
    def distance_to(self, other: 'HandPoint') -> float:
        return math.sqrt((self.x - other.x)**2 + (self.y - other.y)**2)
    
    def distance_to_3d(self, other: 'HandPoint') -> float:
        return math.sqrt((self.x - other.x)**2 + (self.y - other.y)**2 + (self.z - other.z)**2)
    
    def vector_to(self, other: 'HandPoint') -> Tuple[float, float, float]:
        return (other.x - self.x, other.y - self.y, other.z - self.z)


@dataclass
class RecognitionResult: 
    """Recognition result with confidence."""
    letter: str
    confidence: float
    alternatives: List[Tuple[str, float]] = field(default_factory=list)
    finger_states: List[int] = field(default_factory=list)
