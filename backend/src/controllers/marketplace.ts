import type { RequestHandler } from 'express';
import { currentUser } from '../middlewares/auth';
import type { marketplaceService } from '../services/marketplace';
import { ok } from '../utils/http';
import { idParam, newPostBody, pagingQuery, postQuery } from '../validators/marketplace';

export function marketplaceController(marketplace: ReturnType<typeof marketplaceService>) {
  const categories: RequestHandler = async (_req, res) => {
    ok(res, await marketplace.categories());
  };
  const published: RequestHandler = async (req, res) => {
    ok(res, await marketplace.published(postQuery.parse(req.query)));
  };
  const own: RequestHandler = async (req, res) => {
    ok(res, await marketplace.own(currentUser(req).id, pagingQuery.parse(req.query)));
  };
  const pending: RequestHandler = async (req, res) => {
    ok(res, await marketplace.pending(pagingQuery.parse(req.query)));
  };
  const detail: RequestHandler = async (req, res) => {
    ok(res, await marketplace.findPublished(idParam.parse(req.params).id));
  };
  const create: RequestHandler = async (req, res) => {
    ok(res, await marketplace.create(currentUser(req).id, newPostBody.parse(req.body)), 201);
  };
  const moderate =
    (status: 'APPROVED' | 'REJECTED'): RequestHandler =>
    async (req, res) => {
      ok(
        res,
        await marketplace.moderate(idParam.parse(req.params).id, currentUser(req).id, status),
      );
    };

  return { categories, published, own, pending, detail, create, moderate };
}
