import type { Parser } from 'arcsecond';
import { char, possibly, regex, sequenceOf } from 'arcsecond';
import { utils } from 'ethers';

import { NodeType } from '../../../types';
import type {
  CommandExpressionNode,
  Node,
  NodeInterpreter,
} from '../../../types';
import type { AragonDAO } from '../AragonDAO';
import type { AragonOS } from '../AragonOS';
import type { FullPermission } from '../types';
import { optionalLabeledAppIdentifierRegex } from './identifiers';
import { getOptValue, listItems } from '../../../utils';
import { ErrorException } from '../../../errors';

export const DAO_OPT_NAME = 'dao';

export const daoPrefixedIdentifierParser: Parser<
  [string | undefined, string],
  string,
  any
> = sequenceOf([
  possibly(
    sequenceOf([char('_'), regex(/^((?!-)[a-zA-Z0-9-]+(?<!-))/), char(':')]),
  ),
  regex(optionalLabeledAppIdentifierRegex),
]).map(([prefix, appIdentifier]) => [
  prefix ? prefix[1] : undefined,
  appIdentifier,
]);

export const getDAO = (
  module: AragonOS,
  c: CommandExpressionNode,
  appIndex: number,
): AragonDAO => {
  let dao = module.currentDAO;
  const n: Node = c.args[appIndex];

  if (n.type === NodeType.ProbableIdentifier) {
    const res = daoPrefixedIdentifierParser.run(n.value);

    if (!res.isError && res.result[0]) {
      const [daoIdentifier] = res.result;

      dao = module.getModuleBinding(daoIdentifier);
      if (!dao) {
        throw new ErrorException(
          `couldn't found a DAO for ${daoIdentifier} on given identifier ${n.value}`,
        );
      }
    }
  }

  if (!dao) {
    throw new ErrorException('must be used within a "connect" command');
  }

  return dao;
};

export const getDAOByOption = async (
  module: AragonOS,
  c: CommandExpressionNode,
  interpretNode: NodeInterpreter,
): Promise<AragonDAO> => {
  let daoIdentifier = await getOptValue(c, 'dao', interpretNode);

  let dao: AragonDAO | undefined;

  if (!daoIdentifier) {
    dao = module.currentDAO;
    if (!dao) {
      throw new ErrorException(`must be used within a "connect" command`);
    }
  } else {
    daoIdentifier = daoIdentifier.toString
      ? daoIdentifier.toString()
      : daoIdentifier;
    dao = module.getModuleBinding(daoIdentifier);
    if (!dao) {
      throw new ErrorException(
        `--dao option error. No DAO found for identifier ${daoIdentifier}`,
      );
    }
  }

  return dao;
};

export const checkPermissionFormat = (p: FullPermission): void | never => {
  const errors: string[] = [];
  const [granteeAddress, appAddress, role] = p;

  if (!utils.isAddress(granteeAddress)) {
    errors.push(
      `Invalid grantee. Expected an address, but got ${granteeAddress}`,
    );
  }

  if (!utils.isAddress(appAddress)) {
    errors.push(`Invalid app. Expected an address, but got ${appAddress}`);
  }

  if (role.startsWith('0x')) {
    if (role.length !== 66) {
      errors.push(`Invalid role. Expected a valid hash, but got ${role}`);
    }
  }

  if (errors.length) {
    throw new ErrorException(listItems('invalid permission provided', errors));
  }
};
