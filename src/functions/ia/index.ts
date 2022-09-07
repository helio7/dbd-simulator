import { Killer } from "../../classes/killer";
import { Survivor } from "../../classes/survivor";
import { KillerIntention } from "../../constants/constants";

export function simulateKillerBehavior(killer: Killer, survivors: Survivor[]) {
   if (killer.intention === KillerIntention.IDLE) {
     killer.intention = KillerIntention.CHASE;
     killer.focusNearestSurvivor(survivors);
     const { xComponent, yComponent } = killer.runTowardsObjective();
     killer.phaserInstance.setVelocity(xComponent, yComponent);
   } else if (killer.intention === KillerIntention.CHASE) {
     killer.focusNearestSurvivor(survivors);
     const { xComponent, yComponent } = killer.runTowardsObjective();
     killer.phaserInstance.setVelocity(xComponent, yComponent);
   }
}