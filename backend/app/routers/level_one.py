from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal, Optional

router = APIRouter()


class ShootRequest(BaseModel):
    student_id: str
    launcher_charge: Literal["Positif", "Negatif"]
    target: Literal["bola", "statif"]
    current_bola_state: Literal["Netral", "Positif", "Negatif"]
    current_statif_state: Literal["Netral", "Positif", "Negatif"]


class ShootResponse(BaseModel):
    new_bola_state: Literal["Netral", "Positif", "Negatif"]
    new_statif_state: Literal["Netral", "Positif", "Negatif"]
    laser_direction: Optional[Literal["left", "right"]]
    laser_active: bool


@router.post("/shoot", response_model=ShootResponse)
def shoot(req: ShootRequest) -> ShootResponse:
    # Apply the shot to the target only
    new_bola = req.launcher_charge if req.target == "bola" else req.current_bola_state
    new_statif = req.launcher_charge if req.target == "statif" else req.current_statif_state

    # Laser is only active when both objects are charged
    laser_active = new_bola != "Netral" and new_statif != "Netral"

    # Same charge → repulsion (right), opposite charge → attraction (left)
    if laser_active:
        laser_direction: Optional[Literal["left", "right"]] = (
            "right" if new_bola == new_statif else "left"
        )
    else:
        laser_direction = None

    return ShootResponse(
        new_bola_state=new_bola,
        new_statif_state=new_statif,
        laser_direction=laser_direction,
        laser_active=laser_active,
    )
