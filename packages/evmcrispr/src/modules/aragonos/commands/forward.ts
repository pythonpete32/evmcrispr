import { utils } from 'ethers';

import { ErrorException } from '../../../errors';
import type {
  Action,
  CommandFunction,
  TransactionAction,
} from '../../../types';
import { isProviderAction } from '../../../types';

import { batchForwarderActions } from '../utils/forwarders';
import {
  ComparisonType,
  checkArgsLength,
  commaListItems,
} from '../../../utils';
import type { AragonOS } from '../AragonOS';
export const forward: CommandFunction<AragonOS> = async (
  module,
  c,
  { interpretNode, interpretNodes },
) => {
  checkArgsLength(c, {
    type: ComparisonType.Greater,
    minValue: 2,
  });

  const blockCommandsNode = c.args.pop()!;

  const forwarderAppAddresses = await interpretNodes(c.args, false, {
    allowNotFoundError: true,
  });

  const invalidForwarderApps: any[] = [];

  forwarderAppAddresses.forEach((a) =>
    !utils.isAddress(a) ? invalidForwarderApps.push(a) : undefined,
  );

  if (invalidForwarderApps.length) {
    throw new ErrorException(
      `${commaListItems(invalidForwarderApps)} are not valid forwarder address`,
    );
  }

  const blockActions = (await interpretNode(blockCommandsNode, {
    blockModule: module.contextualName,
  })) as Action[];

  if (blockActions.find((a) => isProviderAction(a))) {
    throw new ErrorException(`can't switch networks inside a connect command`);
  }

  return batchForwarderActions(
    module.signer,
    blockActions as TransactionAction[],
    forwarderAppAddresses.reverse(),
  );
};
