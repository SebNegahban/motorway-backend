import { VehicleValuation } from "@app/models/vehicle-valuation"
import { fetchValuationFromPremiumCarValuation } from "@app/premium-car/premium-car-valuation"
import { fetchValuationFromSuperCarValuation } from "@app/super-car/super-car-valuation"

export default class ValuationCalculator {
  private TIMEOUT_IN_MINUTES: number
  private superCarErrorCount = 0
  private superCarCallCount = 0

  constructor(timeoutLength: number = 10){
    this.TIMEOUT_IN_MINUTES = timeoutLength
  }

  async getValue(vrm: string, mileage: number): Promise<VehicleValuation>{

    const errorRate = this.superCarErrorCount / this.superCarCallCount
    let valuation = null

    if(this.superCarErrorCount === 0 || errorRate <= 0.5) {
      this.superCarCallCount += 1
      valuation = await fetchValuationFromSuperCarValuation(vrm, mileage).catch((error: Error) => {
        if(this.superCarErrorCount === 0){
          setTimeout(() => {
            this.superCarErrorCount = 0
            this.superCarCallCount = 0
          }, this.TIMEOUT_IN_MINUTES * 60 * 1000)
        }
        this.superCarErrorCount += 1
        throw new Error('Unable to reach SuperCar')
      })
    } else {
      valuation = await fetchValuationFromPremiumCarValuation(vrm).catch((error) => {
        throw new Error('Service Unavailable', { cause: { code: 503 } })
      })
    }

    return valuation
  }
}