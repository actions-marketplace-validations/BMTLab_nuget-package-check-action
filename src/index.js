/**
 * NuGet Package Index Checker Action
 *
 * This Node.js script is designed to check whether a specific version of a NuGet package
 * is indexed on nuget.org. It's intended to be used as a GitHub Action within CI/CD pipelines
 * to ensure that dependent packages are available before proceeding with builds or deployments.
 *
 * Usage:
 * This script is executed as a part of GitHub Actions workflow, using action inputs
 * to check for package availability. It performs retries up to a specified limit and logs
 * the outcomes to the console, influencing the workflow success or failure based on the result.
 *
 * @file   This file defines the checkNugetPackageIndexed function and includes the main execution
 *         logic to run the function based on GitHub Actions inputs.
 * @author Nikita (BMTLab) Neverov (neverovnikita.bmt@gmail.com)
 * @license MIT
 */

// GitHub Actions toolkit for interaction with GitHub Actions.
import core from '@actions/core'
import axios from 'axios'
import { fileURLToPath } from 'url'
import path from 'path'

/**
 * Utility function to pause execution for a specified duration.
 * @param {number} ms - Duration in milliseconds to pause execution.
 * @returns {Promise<void>} A promise that resolves after the specified duration.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const defaultAttemptsCount = 1
const defaultSleepBetweenAttempts = 30_000

/**
 * Checks if a specific NuGet package version is currently indexed on nuget.org.
 * @param {string} url - The URL to the NuGet package version.
 * @returns {Promise<boolean>} A promise that resolves to true if the package is indexed, false if not found.
 */
async function isPackageIndexed (url) {
  try {
    const response = await axios.get(url)
    return response.status === 200
  } catch (error) {
    if (error.response?.status === 404) {
      return false
    } else if (!error.response) {
      throw new Error('Network error or no response received')
    }

    throw new Error(`HTTP error: ${error.message}`)
  }
}

/**
 * Repeatedly checks if a NuGet package is indexed until the maximum number of attempts is reached.
 * @param {string} packageName - The name of the NuGet package to check.
 * @param {string} packageVersion - The version of the NuGet package to check.
 * @param {number} maxAttempts - The maximum number of times to check if the package is indexed.
 * @param {number} [timeout=30000] - The delay in milliseconds between check attempts. Defaults to 30000 milliseconds.
 * @returns {Promise<boolean>} True if the package is eventually found to be indexed, otherwise false.
 */
export async function checkNugetPackageIndexed (
  packageName,
  packageVersion,
  maxAttempts,
  timeout = defaultSleepBetweenAttempts
) {
  const url = `https://www.nuget.org/api/v2/package/${packageName}/${packageVersion}`

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isIndexed = await isPackageIndexed(url)

    if (isIndexed) {
      console.log(`Package ${packageName} version ${packageVersion} is indexed on nuget.org.`)
      return true
    }

    if (attempt < maxAttempts) {
      console.log(`Attempt ${attempt} of ${maxAttempts}: Package not indexed yet. Retrying in ${timeout / 1_000} seconds...`)
      await sleep(timeout)
    }
  }

  // Set the GitHub Action to fail after all attempts.
  core.setFailed(`Package ${packageName} version ${packageVersion} was not indexed after ${maxAttempts} attempts.`)
  return false
}

/**
 * The main execution function that reads inputs and initiates the checking process.
 */
function run () {
  const packageName = core.getInput('package', { required: true })
  const packageVersion = core.getInput('version', { required: true })
  const maxAttempts = parseInt(core.getInput('attempts'), 10) || defaultAttemptsCount

  checkNugetPackageIndexed(packageName, packageVersion, maxAttempts)
  // Execute the check and handle any errors.
    .catch(error => core.setFailed(error.message))
}

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)

// Check if this script is being run directly (not imported as a module), and if so, execute it.
if (process.argv[1] === currentFile || process.argv[1] === `${currentDir}/index.js`) {
  run()
}
