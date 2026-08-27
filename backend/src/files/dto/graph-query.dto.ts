import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GraphQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxHops?: number = 5;

  @IsOptional()
  @IsIn(['dependents', 'dependencies'])
  direction?: 'dependents' | 'dependencies' = 'dependents';
}
