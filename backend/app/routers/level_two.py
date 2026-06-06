from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal, Optional
import math

router = APIRouter()

DISTANCE_M = 0.03 # Meter
KONSTANTA = 9 * math.pow(10, 9) # k = 9 x 10^9


class ShootRequest(BaseModel):
    student_id: str
    launcher_charge: float = Field(..., ge=-10, le=10)   # μC, set by slider
    target: Literal["bola", "statif"]
    current_bola_charge: float                            # current bola charge in μC
    current_statif_charge: float                          # current statif charge in μC


class ShootResponse(BaseModel):
    new_bola_charge: float
    new_statif_charge: float
    new_bola_state: Literal["Netral", "Positif", "Negatif"]
    new_statif_state: Literal["Netral", "Positif", "Negatif"]
    laser_direction: Optional[Literal["left", "right"]]
    laser_active: bool
    laser_distance: Optional[int]
    force_value: Optional[int]  # result of F = q1*q2 / d^2, None if either charge is 0


def _charge_to_state(charge: float) -> Literal["Netral", "Positif", "Negatif"]:
    if charge > 0:
        return "Positif"
    if charge < 0:
        return "Negatif"
    return "Netral"


@router.post("/shoot", response_model=ShootResponse)
def shoot(req: ShootRequest) -> ShootResponse:
    # Apply launcher charge to the chosen target
    new_bola_charge = req.launcher_charge if req.target == "bola" else req.current_bola_charge
    new_statif_charge = req.launcher_charge if req.target == "statif" else req.current_statif_charge

    new_bola_state = _charge_to_state(new_bola_charge)
    new_statif_state = _charge_to_state(new_statif_charge)

    # Force & laser are only active when both objects carry a non-zero charge
    both_charged = new_bola_charge != 0 and new_statif_charge != 0

    force_value: Optional[int] = None
    laser_distance: Optional[int] = None
    laser_direction: Optional[Literal["left", "right"]] = None
    laser_active = False

    if both_charged:
        # F = q1 * q2 / d^2  (charges in μC, distance in m)
        raw_force = KONSTANTA * (new_statif_charge * math.pow(10, -6) * new_bola_charge * math.pow(10, -6)) / (DISTANCE_M ** 2)
        force_value = round(raw_force)
        print(f"force_value: {force_value}")
        laser_active = True

        # Positive force product → same-sign charges → repulsion (move away = right)
        # Negative force product → opposite-sign charges → attraction (move together = left)
        laser_direction = "right" if raw_force > 0 else "left"

        # Distance is movement magnitude; direction remains in laser_direction.
        force_magnitude = abs(force_value)
        # Scale 100 -> 1, 200 -> 2, 300 -> 3, etc. Keep minimum step 1.
        step_multiplier = max(1, force_magnitude // 100)
        if laser_direction == 'right':
            if step_multiplier < 6:
                offset = 2 + 2*(1-step_multiplier)
            else:
                offset = 2 + 2*(1-step_multiplier) + 5
        else:
            if step_multiplier < 4:
                offset = 2 + 2*(1-step_multiplier)
            elif step_multiplier > 4 and step_multiplier < 7:
                offset = 2 + 2*(1-step_multiplier) + 4
            else:
                offset = 2 + 2*(1-step_multiplier) + 8

        laser_distance = int((step_multiplier*33)+(3-offset))
        print(f"LASER DISTANCE: {laser_distance}")

    return ShootResponse(
        new_bola_charge=new_bola_charge,
        new_statif_charge=new_statif_charge,
        new_bola_state=new_bola_state,
        new_statif_state=new_statif_state,
        laser_direction=laser_direction,
        laser_active=laser_active,
        laser_distance=laser_distance,
        force_value=force_value,
    )
