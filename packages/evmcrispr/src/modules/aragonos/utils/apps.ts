import { utils } from 'ethers';

import type { Address } from '../../../types';
import type {
  App,
  AppArtifact,
  AppArtifactCache,
  ParsedApp,
  PermissionMap,
} from '../types';

import { parseAppArtifactName } from './parsers';

export const buildAppPermissions = (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  artifactRoles: any,
  currentPermissions: any[],
): PermissionMap => {
  const appPermissions = artifactRoles.reduce(
    (roleMap: PermissionMap, role: any) => {
      roleMap.set(role.bytes, { manager: '', grantees: new Set() });
      return roleMap;
    },
    new Map(),
  );

  currentPermissions.forEach((role) => {
    appPermissions.set(role.roleHash, {
      ...appPermissions.get(role.roleHash),
      manager: role.manager,
      grantees: new Set(
        role.grantees.map(
          ({ granteeAddress }: { granteeAddress: Address }) => granteeAddress,
        ),
      ),
    });
  });

  return appPermissions;
};

export const buildApp = (
  parsedApp: ParsedApp,
  appResourcesCache: AppArtifactCache,
): App | null => {
  const { address, codeAddress, contentUri, name, registryName, roles } =
    parsedApp;

  if (!appResourcesCache.has(codeAddress)) {
    return null;
  }
  const {
    abiInterface,
    appName,
    roles: artifactRoles,
  } = appResourcesCache.get(codeAddress)!;

  return {
    abiInterface,
    address,
    codeAddress,
    contentUri,
    name,
    permissions: buildAppPermissions(artifactRoles, roles),
    registryName:
      registryName && registryName.length
        ? registryName
        : parseAppArtifactName(appName),
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildAppArtifact = (artifact: any): AppArtifact => ({
  appName: artifact.appName as string,
  abiInterface: new utils.Interface(artifact.abi),
  roles: artifact.roles,
  functions: artifact.functions,
});
