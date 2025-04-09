import ValuationCalculator from "../valuation-calculator"

const mocks = vi.hoisted(() => {
  return {
    superCarValuationResponse: vi.fn(),
    premiumCarValuationResponse: vi.fn(),
  }
}) 

vi.mock('@app/super-car/super-car-valuation', () => {
  return {
    fetchValuationFromSuperCarValuation: mocks.superCarValuationResponse
  }
})

vi.mock('@app/premium-car/premium-car-valuation', () => {
  return {
    fetchValuationFromPremiumCarValuation: mocks.premiumCarValuationResponse
  }
})


describe('ValuationCalculator', () => {
  it('should default to calling SuperCar', async () => {
    mocks.superCarValuationResponse.mockResolvedValue({
      vrm: 'ABC123',
      lowestValue: 0,
      highestValue: 10,
      midpointValue: 5,
      provider: 'SuperCar'
    })
    mocks.premiumCarValuationResponse.mockResolvedValue({
      vrm: 'ABC123',
      lowestValue: 0,
      highestValue: 10,
      midpointValue: 5,
      provider: 'PremiumCar'
    })

    const valuationCalculator = new ValuationCalculator()
    const valuation = await valuationCalculator.getValue('ABC123', 100000)

    expect(valuation.provider).toEqual('SuperCar')
  })

  it('should fall back to PremiumCar if SuperCar has an error rate >50%', async () => {
    mocks.superCarValuationResponse.mockRejectedValue({})
    mocks.premiumCarValuationResponse.mockResolvedValue({
      vrm: 'ABC123',
      lowestValue: 0,
      highestValue: 10,
      midpointValue: 5,
      provider: 'PremiumCar'
    })

    const valuationCalculator = new ValuationCalculator()

    // First call causes 100% failure rate
    await expect(() => valuationCalculator.getValue('ABC123', 10000)).rejects.toThrowError('Unable to reach SuperCar')

    // Second call hits backup due to failure rate
    const valuation = await valuationCalculator.getValue('ABC123', 10000)
  
    expect(valuation.provider).toEqual('PremiumCar')
  })

  it('should reset the error rate after the specified length of time', async () => {
    mocks.superCarValuationResponse.mockRejectedValue({})
    mocks.premiumCarValuationResponse.mockResolvedValue({
      vrm: 'ABC123',
      lowestValue: 0,
      highestValue: 10,
      midpointValue: 5,
      provider: 'PremiumCar'
    })

    // set timeout to 100ms
    const valuationCalculator = new ValuationCalculator(1/600)

    // First call causes 100% failure rate
    await expect(() => valuationCalculator.getValue('ABC123', 10000)).rejects.toThrowError('Unable to reach SuperCar')

    // Second call hits backup due to failure rate
    const valuation = await valuationCalculator.getValue('ABC123', 10000)
    expect(valuation.provider).toEqual('PremiumCar')

    // pause for 150ms
    await new Promise(f => setTimeout(f, 150))
  
    mocks.superCarValuationResponse.mockResolvedValue({
      vrm: 'ABC123',
      lowestValue: 0,
      highestValue: 10,
      midpointValue: 5,
      provider: 'SuperCar'
    })

    const reEvaluation = await valuationCalculator.getValue('ABC123', 100000)
    expect(reEvaluation.provider).toEqual('SuperCar')
  })

  it('should return a 503 Service Unavailable if both providers are down', async () => {
    mocks.superCarValuationResponse.mockRejectedValue({})
    mocks.premiumCarValuationResponse.mockRejectedValue({})

    // set timeout to 100ms
    const valuationCalculator = new ValuationCalculator()

    // First call causes 100% failure rate
    await expect(() => valuationCalculator.getValue('ABC123', 10000)).rejects.toThrowError('Unable to reach SuperCar')
    await expect(() => valuationCalculator.getValue('ABC123', 10000)).rejects.toThrowError('Service Unavailable')
  })
})
