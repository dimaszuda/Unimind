from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal, Optional
import math

router = APIRouter()

KONSTANTA = 9 * math.pow(10, 9)  # k = 9 x 10^9 N·m²/C²


class ShootRequestL3(BaseModel):
    student_id: str
    launcher_charge: float = Field(..., ge=-10, le=10)   # μC, set by slider
    target: Literal["bola", "statif"]
    current_bola_charge: float                            # current bola charge in μC
    current_statif_charge: float                          # current statif charge in μC
    distance_cm: float = Field(..., ge=1, le=10)         # distance in cm, 1–10


class ShootResponseL3(BaseModel):
    new_bola_charge: float
    new_statif_charge: float
    new_bola_state: Literal["Netral", "Positif", "Negatif"]
    new_statif_state: Literal["Netral", "Positif", "Negatif"]
    laser_direction: Optional[Literal["left", "right"]]
    laser_active: bool
    laser_distance: Optional[float]
    force_value: Optional[int]


class ForceRequest(BaseModel):
    distance_cm: float = Field(..., ge=1, le=10)
    q1: float   # μC
    q2: float   # μC


class ForceResponse(BaseModel):
    force_value: Optional[float]


def _charge_to_state(charge: float) -> Literal["Netral", "Positif", "Negatif"]:
    if charge > 0:
        return "Positif"
    if charge < 0:
        return "Negatif"
    return "Netral"


@router.post("/shoot", response_model=ShootResponseL3)
def shoot(req: ShootRequestL3) -> ShootResponseL3:
    new_bola_charge = req.launcher_charge if req.target == "bola" else req.current_bola_charge
    new_statif_charge = req.launcher_charge if req.target == "statif" else req.current_statif_charge

    new_bola_state = _charge_to_state(new_bola_charge)
    new_statif_state = _charge_to_state(new_statif_charge)

    both_charged = new_bola_charge != 0 and new_statif_charge != 0

    force_value: Optional[float] = None
    laser_distance: Optional[float] = None
    laser_direction: Optional[Literal["left", "right"]] = None
    laser_active = False

    if both_charged:
        distance_m = req.distance_cm / 100
        raw_force = KONSTANTA * (new_statif_charge * 1e-6 * new_bola_charge * 1e-6) / (distance_m ** 2)
        force_value = round(raw_force)
        laser_active = True
        laser_direction = "right" if raw_force > 0 else "left"

        force_magnitude = abs(force_value)

        if force_magnitude < 500:
            laser_distance = 69/200 * force_magnitude
        else:
            laser_distance = 69/200 * force_magnitude - 5

        print(f"LASER DISTANCE: {laser_distance}")
        print(f"force Value: {force_value}")

    return ShootResponseL3(
        new_bola_charge=new_bola_charge,
        new_statif_charge=new_statif_charge,
        new_bola_state=new_bola_state,
        new_statif_state=new_statif_state,
        laser_direction=laser_direction,
        laser_active=laser_active,
        laser_distance=laser_distance,
        force_value=force_value,
    )


@router.post("/force", response_model=ForceResponse)
def calculate_force(req: ForceRequest) -> ForceResponse:
    if req.q1 == 0 or req.q2 == 0:
        return ForceResponse(force_value=None)
    distance_m = req.distance_cm / 100
    raw_force = KONSTANTA * (req.q1 * 1e-6 * req.q2 * 1e-6) / (distance_m ** 2)
    return ForceResponse(force_value=round(raw_force, 4))
