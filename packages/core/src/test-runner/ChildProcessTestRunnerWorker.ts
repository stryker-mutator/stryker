import { StrykerOptions } from '@stryker-mutator/api/core';
import { commonTokens, Injector, PluginContext, PluginKind, tokens } from '@stryker-mutator/api/plugin';
import {
  TestRunner2,
  DryRunOptions,
  MutantRunOptions,
  MutantRunResult,
  DryRunResult,
  DryRunStatus,
  MutantRunStatus,
} from '@stryker-mutator/api/test_runner2';

import { errorToString } from '@stryker-mutator/util';

import { PluginCreator } from '../di';

export class ChildProcessTestRunnerWorker implements TestRunner2 {
  private readonly underlyingTestRunner: TestRunner2;

  public static inject = tokens(commonTokens.options, commonTokens.injector);
  constructor({ testRunner }: StrykerOptions, injector: Injector<PluginContext>) {
    this.underlyingTestRunner = injector.injectFunction(PluginCreator.createFactory(PluginKind.TestRunner2)).create(testRunner);
  }

  public async init(): Promise<void> {
    if (this.underlyingTestRunner.init) {
      await this.underlyingTestRunner.init();
    }
  }

  public async dispose() {
    if (this.underlyingTestRunner.dispose) {
      await this.underlyingTestRunner.dispose();
    }
  }

  public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
    const dryRunResult = await this.underlyingTestRunner.dryRun(options);
    if (dryRunResult.status === DryRunStatus.Complete && !dryRunResult.mutantCoverage && options.coverageAnalysis !== 'off') {
      // @ts-expect-error
      dryRunResult.mutantCoverage = global.__mutantCoverage__;
    }
    if (dryRunResult.status === DryRunStatus.Error) {
      dryRunResult.errorMessage = errorToString(dryRunResult.errorMessage);
    }
    return dryRunResult;
  }
  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    const result = await this.underlyingTestRunner.mutantRun(options);
    if (result.status === MutantRunStatus.Error) {
      result.errorMessage = errorToString(result.errorMessage);
    }
    return result;
  }
}
