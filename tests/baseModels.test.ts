import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiSubset from 'chai-subset';
import { Types } from 'mongoose';

import config from '../src/config';
import { connection, User, Organisation } from '../src/_helpers/db';
import { OrganisationClass, UserClass } from '../src/models';
import { server } from '../src/server';
import { usersService } from '../src/services';

const should = chai.should();
chai.use(chaiHttp);
chai.use(chaiSubset);

const defaultUser = {
  username: 'test@test.test',
  password: '1234',
};

const defaultModel = {
  control: {
    name: 'Test Control',
    cost: 1000.0,
  },
  event: {
    game: new Types.ObjectId(),
    name: 'Test Event',
    cost: 1000.0,
    likelihood: 1,
  },
  game: {
    owner: new Types.ObjectId(),
  },
  securityArea: {
    number: 'TEST',
    name: 'Test SecurityArea',
    source: 'Test Source',
  },
  organisation: {
    name: 'Test Org.',
    joiningCode: '1234',
  },
};

const registerPath: string = '/users/register';
const loginPath: string = '/users/login';

const models = ['control', 'event', 'game', 'securityArea', 'organisation', 'user'];

const rules = {
  control: {
    createRequiresAdmin: true,
    updateRequiresAdmin: true,
    deleteRequiresAdmin: true,
  },
  event: {
    createRequiresAdmin: true,
    updateRequiresAdmin: true,
    deleteRequiresAdmin: true,
    getAllRequiresAdmin: true,
  },
  game: {},
  securityArea: {
    createRequiresAdmin: true,
    updateRequiresAdmin: true,
    deleteRequiresAdmin: true,
  },
  organisation: {
    getAllRequiresAdmin: true,
  },
  user: {
    getAllRequiresAdmin: true,
  },
};

models.forEach((model) => {
  const basePath: string = `/${model}s`;
  const createPath: string = `${basePath}/create`;
  const getAllPath: string = `${basePath}/`;
  const getPath: string = `${basePath}/:id`;
  const getValuePath: string = `${basePath}/:id/get/:fieldName`;
  const deletePath: string = `${basePath}/delete`;

  describe(`'${model}' base route tests`, () => {
    before((done) => {
      if (config.env !== 'test') throw new Error("NODE_ENV !== 'test'! Aborting!");

      if (connection.readyState == 1) done();
      //console.debug('Database connected');
      else throw 'No database connection! Aborting!';
    });

    beforeEach(async () => {
      const collections = await connection.db.listCollections().toArray();

      await collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          connection.db.dropCollection(collectionName);
        });
    });

    afterEach(async () => {
      const collections = await connection.db.listCollections().toArray();

      await collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          connection.db.dropCollection(collectionName);
        });
    });

    after((done) => {
      done();
      /*connection.db
        .dropDatabase()
        .then(() => {
          connection
            .close()
            .then(() => done())
            .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));*/
    });

    describe(`/POST ${createPath}`, () => {
      const adminFailTo: string = rules[model].createRequiresAdmin ? 'fail to ' : '';

      it('should fail without auth', () => {
        return chai
          .request(server)
          .post(createPath)
          .send({ newDetails: defaultModel[model] })
          .then((res) => {
            res.should.have.status(401);
            res.body.message.should.equal('Unauthorised');
          });
      });

      it(`should ${adminFailTo}create a new ${model}`, () => {
        return chai
          .request(server)
          .post(registerPath)
          .send({ newDetails: defaultUser })
          .then((res) => {
            res.should.have.status(201);

            chai
              .request(server)
              .post(loginPath)
              .send({ username: defaultUser.username, password: defaultUser.password })
              .then((res) => {
                res.should.have.status(200);
                res.body.jwtToken.should.exist;

                const token: string = res.body.jwtToken;

                chai
                  .request(server)
                  .post(createPath)
                  .set('Authorization', 'Bearer ' + token)
                  .send({ newDetails: defaultModel[model] })
                  .then((res) => {
                    if (rules[model].createRequiresAdmin) {
                      res.should.have.status(401);
                      res.body.message.should.equal('User is not an admin.');
                    } else {
                      res.should.have.status(201);
                      res.body.should.have.property('id');
                    }
                  });
              });
          });
      });
    });

    describe(`/GET ${getAllPath}`, () => {
      const adminFailTo: string = rules[model].getAllRequiresAdmin ? 'fail to ' : '';

      it('should fail without auth', () => {
        return chai
          .request(server)
          .get(getAllPath)
          .send({ newDetails: defaultModel[model] })
          .then((res) => {
            res.should.have.status(401);
            res.body.message.should.equal('Unauthorised');
          });
      });

      it(`should ${adminFailTo}get all existing ${model}s`, () => {
        return chai
          .request(server)
          .post(registerPath)
          .send({ newDetails: defaultUser })
          .then((res) => {
            res.should.have.status(201);

            chai
              .request(server)
              .post(loginPath)
              .send({ username: defaultUser.username, password: defaultUser.password })
              .then((res) => {
                res.should.have.status(200);
                res.body.jwtToken.should.exist;

                const token: string = res.body.jwtToken;

                chai
                  .request(server)
                  .post(createPath)
                  .set('Authorization', 'Bearer ' + token)
                  .send({ newDetails: defaultModel[model] })
                  .then((res) => {
                    if (rules[model].createRequiresAdmin) {
                      res.should.have.status(401);
                      res.body.message.should.equal('User is not an admin.');
                    } else {
                      res.should.have.status(201);
                      res.body.should.have.property('id');

                      const model = res.body;

                      chai
                        .request(server)
                        .get(getAllPath)
                        .set('Authorization', 'Bearer ' + token)
                        .send()
                        .then((res) => {
                          if (rules[model].getAllRequiresAdmin) {
                            res.should.have.status(401);
                            res.body.message.should.equal('User is not an admin.');
                          } else {
                            res.should.have.status(201);
                            res.body.should.be.an('array');
                            res.body.should.have.lengthOf(1);
                          }
                        });
                    }
                  });
              });
          });
      });
    });

    describe(`/GET ${getPath}`, () => {
      it('should fail without auth', () => {
        return chai
          .request(server)
          .get(`${basePath}/1`)
          .send({ newDetails: defaultModel[model] })
          .then((res) => {
            res.should.have.status(401);
            res.body.message.should.equal('Unauthorised');
          });
      });

      it(`should get an existing ${model}`, () => {
        return chai
          .request(server)
          .post(registerPath)
          .send({ newDetails: defaultUser })
          .then((res) => {
            res.should.have.status(201);

            chai
              .request(server)
              .post(loginPath)
              .send({ username: defaultUser.username, password: defaultUser.password })
              .then((res) => {
                res.should.have.status(200);
                res.body.jwtToken.should.exist;

                const token: string = res.body.jwtToken;

                chai
                  .request(server)
                  .post(createPath)
                  .set('Authorization', 'Bearer ' + token)
                  .send({ newDetails: defaultModel[model] })
                  .then((res) => {
                    if (rules[model].createRequiresAdmin) {
                      res.should.have.status(401);
                      res.body.message.should.equal('User is not an admin.');
                    } else {
                      res.should.have.status(201);
                      res.body.should.have.property('id');

                      const model = res.body;

                      chai
                        .request(server)
                        .get(`${basePath}/${model.id}`)
                        .set('Authorization', 'Bearer ' + token)
                        .send()
                        .then((res) => {
                          res.should.have.status(200);
                          res.body.should.eql(model);
                        });
                    }
                  });
              });
          });
      });
    });

    describe(`/GET ${getValuePath}`, () => {
      const adminFailTo: string = rules[model].createRequiresAdmin ? 'fail to ' : '';

      it('should fail without auth', () => {
        return chai
          .request(server)
          .get(`${basePath}/1/get/_id`)
          .send({ newDetails: defaultModel[model] })
          .then((res) => {
            res.should.have.status(401);
            res.body.message.should.equal('Unauthorised');
          });
      });

      it(`should get the value of an existing ${model}'s ID field`, () => {
        return chai
          .request(server)
          .post(registerPath)
          .send({ newDetails: defaultUser })
          .then((res) => {
            res.should.have.status(201);

            chai
              .request(server)
              .post(loginPath)
              .send({ username: defaultUser.username, password: defaultUser.password })
              .then((res) => {
                res.should.have.status(200);
                res.body.jwtToken.should.exist;

                const token: string = res.body.jwtToken;

                chai
                  .request(server)
                  .post(createPath)
                  .set('Authorization', 'Bearer ' + token)
                  .send({ newDetails: defaultModel[model] })
                  .then((res) => {
                    res.should.have.status(201);
                    res.body.should.have.property('id');

                    const model = res.body;

                    chai
                      .request(server)
                      .get(`${basePath}/${model.id}/get/_id`)
                      .set('Authorization', 'Bearer ' + token)
                      .send()
                      .then((res) => {
                        res.should.have.status(200);
                        res.body.should.eql(model.id);
                      });
                  });
              });
          });
      });
    });

    describe(`/DELETE ${deletePath}`, () => {
      const adminFailTo: string = rules[model].deleteRequiresAdmin ? 'fail to ' : '';

      it('should fail without auth', () => {
        return chai
          .request(server)
          .delete(deletePath)
          .send({ newDetails: defaultModel[model] })
          .then((res) => {
            res.should.have.status(401);
            res.body.message.should.equal('Unauthorised');
          });
      });

      it(`should ${adminFailTo}delete an existing ${model}`, () => {
        return chai
          .request(server)
          .post(registerPath)
          .send({ newDetails: defaultUser })
          .then((res) => {
            res.should.have.status(201);

            chai
              .request(server)
              .post(loginPath)
              .send({ username: defaultUser.username, password: defaultUser.password })
              .then((res) => {
                res.should.have.status(200);
                res.body.jwtToken.should.exist;

                const token: string = res.body.jwtToken;

                chai
                  .request(server)
                  .post(createPath)
                  .set('Authorization', 'Bearer ' + token)
                  .send({ newDetails: defaultModel[model] })
                  .then((res) => {
                    res.should.have.status(201);
                    res.body.should.have.property('id');

                    const { id } = res.body;

                    chai
                      .request(server)
                      .delete(deletePath)
                      .set('Authorization', 'Bearer ' + token)
                      .send({ id })
                      .send()
                      .then((res) => {
                        if (rules[model].deleteRequiresAdmin) {
                          res.should.have.status(401);
                          res.body.message.should.equal('User is not an admin.');
                        } else {
                          res.should.have.status(204);
                        }
                      });
                  });
              });
          });
      });
    });
    // TODO: DELETE tests
  });
});
