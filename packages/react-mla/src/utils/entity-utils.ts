// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IEntityConfiguration, type ILinkConfiguration } from "../interfaces/configuration";
import { type IEntity, type ILink } from "../interfaces/data-models";
import { generateUUID, getInternalId } from "./utils";

/**
 * Creates a new entity based on the provided entity configuration
 * @param type The entity configuration to base the new entity on
 * @returns A new entity instance
 */
export function createEntity(type: IEntityConfiguration): IEntity {
  return {
    Id: generateUUID(),
    InternalId: getInternalId(),
    TypeId: type.TypeId,
    GlobalType: type.GlobalType,
    LabelLong: "",
    LabelShort: "",
    LabelChart: "",
    SourceSystemId: "Egenskapad",
    Properties: [],
  };
}

/**
 * Creates a new link between two entities based on the provided link configuration
 * @param from The source entity
 * @param to The target entity
 * @param type The link configuration to base the new link on
 * @returns A new link instance
 */
export function createLink(from: IEntity, to: IEntity, type: ILinkConfiguration, color: string): ILink {
  return {
    Id: generateUUID(),
    InternalId: getInternalId(),
    TypeId: type.TypeId,
    GlobalType: type.GlobalType,
    LabelLong: "",
    LabelShort: "",
    LabelChart: "",
    Color: color,
    SourceSystemId: "Egenskapad",
    FromEntityId: from.Id,
    FromEntityTypeId: from.TypeId,
    ToEntityId: to.Id,
    ToEntityTypeId: to.TypeId,
    Direction: from.TypeId === to.TypeId ? "NONE" : "TO",
    Properties: [],
  };
}
