import 'reflect-metadata';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SyncableEntityName } from '@pee/types';

const SYNCABLE_ENTITY_NAMES: SyncableEntityName[] = ['project', 'goal', 'task'];

export class SyncPushChangeDto {
  @IsIn(SYNCABLE_ENTITY_NAMES)
  entity!: SyncableEntityName;

  @IsUUID()
  id!: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsDateString()
  clientUpdatedAt!: string;

  @IsInt()
  @Min(1)
  clientVersion!: number;
}

export class SyncPushRequestDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SyncPushChangeDto)
  changes!: SyncPushChangeDto[];
}
