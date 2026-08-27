import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';
import { Neo4jService } from './neo4j.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NEO4J_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.getOrThrow<string>('COGNODB_URI');
        const user = config.getOrThrow<string>('COGNODB_USER');
        const password = config.getOrThrow<string>('COGNODB_PASSWORD');

        return neo4j.driver(uri, neo4j.auth.basic(user, password), {
          maxConnectionPoolSize: 20,
          disableLosslessIntegers: true,
        });
      },
    },
    Neo4jService,
  ],
  exports: [Neo4jService],
})
export class Neo4jModule {}
