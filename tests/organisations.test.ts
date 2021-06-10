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

const defaultOrganisation = {
  name: 'Test Org.',
  joiningCode: '1234',
};

const registerPath: string = '/users/register';
const loginPath: string = '/users/login';

const basePath: string = `/organisations`;
const createPath: string = `${basePath}/create`;
const getPath: string = `${basePath}/:id`;
const getValuePath: string = `${getPath}/get/:fieldName`;
const updatePath: string = `${basePath}/update`;

describe("'organisation' route tests", () => {
  before((done) => {
    if (config.env !== 'test') throw new Error("NODE_ENV !== 'test'! Aborting!");

    if (connection.readyState == 1) console.log('Database connected');
    else throw 'No database connection! Aborting!';

    done();
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
    it('should fail without name', (done) => {
      chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .end((err, res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.jwtToken.should.exist;

              const token: string = res.body.jwtToken;
              const { name, ...organisation } = defaultOrganisation;

              chai
                .request(server)
                .post(createPath)
                .set('Authorization', 'Bearer ' + token)
                .send({ newDetails: organisation })
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.message.should.equal('Missing required field: "name"');
                  done();
                });
            });
        });
    });

    it('default values are as expected', (done) => {
      chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .end((err, res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.jwtToken.should.exist;

              const { jwtToken: token, id: userId }: { jwtToken: string; id: Types.ObjectId } = res.body;

              chai
                .request(server)
                .post(createPath)
                .set('Authorization', 'Bearer ' + token)
                .send({ newDetails: defaultOrganisation })
                .end((err, res) => {
                  res.should.have.status(201);
                  res.body.should.containSubset({
                    owner: userId,
                    name: defaultOrganisation.name,
                    balance: 0,
                    controls: [],
                    size: 'Medium',
                    industry: 'Information and communication',
                    members: [userId],
                    joiningCode: defaultOrganisation.joiningCode,
                    events: [],
                  });
                  done();
                });
            });
        });
    });
  });

  describe(`/PATCH ${updatePath}`, () => {
    it('should fail without auth', (done) => {
      chai
        .request(server)
        .patch(updatePath)
        .send({ newDetails: defaultOrganisation })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.message.should.equal('Unauthorised');
          done();
        });
    });

    it('should update an existing organisation', (done) => {
      chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .end((err, res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.jwtToken.should.exist;

              const token: string = res.body.jwtToken;

              chai
                .request(server)
                .post(createPath)
                .set('Authorization', 'Bearer ' + token)
                .send({ newDetails: defaultOrganisation })
                .end((err, res) => {
                  res.should.have.status(201);
                  res.body.should.have.property('id');

                  const organisation = res.body;
                  organisation.name = 'Test Update Org';

                  chai
                    .request(server)
                    .patch(updatePath)
                    .set('Authorization', 'Bearer ' + token)
                    .send({ updatedDetails: { id: organisation.id, name: 'Test Update Org' } })
                    .end((err, res) => {
                      res.should.have.status(200);
                      res.body.should.eql(organisation);
                      done();
                    });
                });
            });
        });
    });
  });

  describe(`/GET ${getValuePath}`, () => {
    it("should get an existing organisation's name", (done) => {
      chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .end((err, res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.jwtToken.should.exist;

              const token: string = res.body.jwtToken;

              chai
                .request(server)
                .post(createPath)
                .set('Authorization', 'Bearer ' + token)
                .send({ newDetails: defaultOrganisation })
                .end((err, res) => {
                  res.should.have.status(201);
                  res.body.should.have.property('id');

                  const organisation: OrganisationClass = res.body;

                  chai
                    .request(server)
                    .get(`${basePath}/${organisation.id}/get/name`)
                    .set('Authorization', 'Bearer ' + token)
                    .send()
                    .end((err, res) => {
                      res.should.have.status(200);
                      res.body.should.equal(organisation.name);
                      done();
                    });
                });
            });
        });
    });
  });
});
