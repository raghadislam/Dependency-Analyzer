import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/config/env.schema';
import { Neo4jModule } from './neo4j/neo4j.module';
import { HealthModule } from './health/health.module';
import { FilesModule } from './files/files.module';
import { InsightsModule } from './insights/insights.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    Neo4jModule,
    HealthModule,
    FilesModule,
    InsightsModule,
  ],
})
export class AppModule {}
