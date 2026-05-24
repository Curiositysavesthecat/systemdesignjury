import { ComponentNodeMemo } from './ComponentNode';
import { AnnotationNodeMemo } from './AnnotationNode';
import { EntityNodeMemo } from './EntityNode';
import { ResourceNodeMemo } from './ResourceNode';

export const wizardNodeTypes = {
  entity: EntityNodeMemo,
};

export const apiWizardNodeTypes = {
  resource: ResourceNodeMemo,
};

export const nodeTypes = {
  service: ComponentNodeMemo,
  database: ComponentNodeMemo,
  cache: ComponentNodeMemo,
  queue: ComponentNodeMemo,
  loadbalancer: ComponentNodeMemo,
  cdn: ComponentNodeMemo,
  gateway: ComponentNodeMemo,
  client: ComponentNodeMemo,
  storage: ComponentNodeMemo,
  dns: ComponentNodeMemo,
  search: ComponentNodeMemo,
  notification: ComponentNodeMemo,
  streaming: ComponentNodeMemo,
  pipeline: ComponentNodeMemo,
  scheduler: ComponentNodeMemo,
  monitoring: ComponentNodeMemo,
  generic: ComponentNodeMemo,
  annotation: AnnotationNodeMemo,
};
