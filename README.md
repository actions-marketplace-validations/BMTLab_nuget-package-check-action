# nuget-package-check-action

[![CI-Main](https://github.com/BMTLab/nuget-package-check-action/actions/workflows/ci-main.yml/badge.svg)](https://github.com/BMTLab/nuget-package-check-action/actions/workflows/ci-main.yml)

- [x] Automates NuGet package availability checks, ensuring packages exist and are indexed on [nuget.org](https://nuget.org).
- [x] Supports multiple verification attempts and can suspend CI/CD workflows until the package is published.

## How to use

:white_check_mark: To quickly check if the package exists and is available on NuGet, please add the following job:

```yaml
- name: Check Available NuGet Package
  uses: actions/nuget-package-check-action@v1
  with:
    package: YourAwesomePackage
    version: 1.3.505
```

:white_check_mark: If your workflow publishes a package and further work requires that the package is already available and indexed,
please set a reasonable number of retries:

> [!TIP]
> The retry interval is 30 seconds,
so 10 retries are usually enough time between publishing and when the package is indexed and available.

```yaml
- name: Check Available NuGet Package
  uses: actions/nuget-package-check-action@v1
  with:
    package: YourAwesomePackage
    version: 1.3.505
    attempts: 10
```

:x: The job will terminate with an error if no package is found.

## Compatibility
| Ubuntu    | Windows |       MacOS |
|:----------|:-------:|------------:|
| :white_check_mark:  |  :white_check_mark:  | :white_check_mark: |

> [!IMPORTANT]
> When you're using self-hosted runners, please make sure you have Node.js v20 installed!

## Contributing
Please feel free to contribute or let me know if you find a bug. 
Also, any ideas for improvement would be appreciated :innocent:

