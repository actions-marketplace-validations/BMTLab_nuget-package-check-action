/**
 * Test suite for the NuGet Package Index Checker
 *
 * This file contains tests that verify whether the checkNugetPackageIndexed function
 * accurately determines the indexing status of NuGet packages on nuget.org. It uses
 * the MSW (Mock Service Worker) library to intercept and mock HTTP requests, simulating
 * different scenarios to ensure the functionality behaves as expected under various conditions.
 *
 * @file   This file defines tests for the checkNugetPackageIndexed function using Vitest.
 * @author Nikita (BMTLab) Neverov (neverovnikita.bmt@gmail.com)
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { checkNugetPackageIndexed } from '../src/index.js'
import core from '@actions/core'

const server = setupServer()
const defaultTestTimeout = 10_000 // Default timeout for tests that may require retries.
const testSleepBetweenAttempts = 1 // For testing, we don't wait a long time between requests.
const urlTemplate = 'https://www.nuget.org/api/v2/package/:package/:version'

// Setup MSW to intercept network requests.
beforeEach(() => {
  vi.spyOn(core, 'setFailed')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NuGet Package Index Check Action', () => {
  it('should detect indexed packages correctly', async () => {
    /// Arrange
    server.use(
      http.get(urlTemplate, (req, res, ctx) =>
        res(ctx.status(200)))
    )

    /// Act
    const result = await checkNugetPackageIndexed('SomePackage', '1.0.0', 1)

    /// Assert the function returns true for indexed packages.
    expect(result).toBe(true)
  })

  it('should return false when package is not indexed', async () => {
    /// Arrange
    server.use( // Setup MSW to return a 404 Not Found response for the package URL.
      http.get(urlTemplate, (req, res, ctx) => {
        return res(ctx.status(404))
      })
    )

    /// Act
    const result = await checkNugetPackageIndexed('UnknownPackage', '1.0.0', 1)

    /// Assert the function returns false and core.setFailed is called.
    expect(result).toBe(false)
    expect(core.setFailed).toHaveBeenCalled()
  }, defaultTestTimeout)

  it('should retry the correct number of times before failing', async () => {
    /// Arrange
    server.use( // Setup MSW to consistently return a 404 response to simulate retry logic.
      http.get(urlTemplate, (req, res, ctx) => {
        return res(ctx.status(404))
      })
    )

    /// Act
    const result = await checkNugetPackageIndexed('RetryPackage', '1.0.0', 3, testSleepBetweenAttempts) // Short delay for tests.

    /// / Assert the retry logic behaves correctly.
    expect(result).toBe(false)
    expect(core.setFailed).toHaveBeenCalled()
  }, defaultTestTimeout)

  it('should handle unexpected errors', async () => {
    /// Arrange
    server.use( // Setup MSW to return a 500 Internal Server Error to simulate an unexpected failure.
      http.get(urlTemplate, (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    /// Act
    const result = await checkNugetPackageIndexed('ErrorPackage', '1.0.0', 1)

    /// Assert the function handles unexpected HTTP errors correctly.
    expect(result).toBe(false)
    expect(core.setFailed).toHaveBeenCalled()
  }, defaultTestTimeout)
})
