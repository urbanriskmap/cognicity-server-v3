/**
 * CogniCity Server /reports/archive endpoint
 * @module src/api/reports/archive/index
 **/
import {Router} from 'express';

// Import our data model
import archive from './model';

// Import any required utility functions
import {cacheResponse, handleGeoResponse} from '../../../../lib/util';

// Import validation dependencies
import BaseJoi from 'joi';
import Extension from 'joi-date-extensions';
const Joi = BaseJoi.extend(Extension);
import validate from 'celebrate';
/**
 * Methods to get historic flood reports from database
 * @alias module:src/api/reports/archive/index
 * @param {Object} config Server configuration
 * @param {Object} db PG Promise database instance
 * @param {Object} logger Configured Winston logger instance
 * @return {Object} api Express router object for reports route
 */
export default ({config, db, logger}) => {
  let api = Router(); // eslint-disable-line new-cap

  // Get a list of all reports
  api.get('/', cacheResponse('1 minute'),

    validate({
      query: {
        city: Joi.any().valid(config.REGION_CODES),
        start: Joi.date().format('YYYY-MM-DDTHH:mm:ssZ').required(),
        end: Joi.date().format('YYYY-MM-DDTHH:mm:ssZ')
          .min(Joi.ref('start')).required(),
        geoformat: Joi.any().valid(config.GEO_FORMATS)
          .default(config.GEO_FORMAT_DEFAULT),
      },
    }),
    (req, res, next) => {
      // validate the time window, if fails send 400 error
      let maxWindow = new Date(req.query.start).getTime() +
      (config.API_REPORTS_TIME_WINDOW_MAX * 1000);
      let end = new Date(req.query.end);
      if (end > maxWindow) {
        res.status(400).json({'statusCode': 400, 'error': 'Bad Request',
          'message': 'child \'end\' fails because [end is more than '
          + config.API_REPORTS_TIME_WINDOW_MAX
          + ' seconds greater than \'start\']',
        'validation': {
          'source': 'query',
          'keys': [
            'end',
        ]}});
        return;
      }
      archive(config, db, logger)
      .all(req.query.start, req.query.end, req.query.city)
      .then((data) => handleGeoResponse(data, req, res, next))
      .catch((err) => {
        /* istanbul ignore next */
        logger.error(err);
        /* istanbul ignore next */
        next(err);
      });
    }
  );

  return api;
};
