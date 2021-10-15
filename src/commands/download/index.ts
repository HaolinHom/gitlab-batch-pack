import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import * as console from 'console';
import axios from 'axios';
import { fsExtra, prompts } from '../../deps';
import { getCache, setCache } from '../../utils/cache';
import { groups, groupsInfo, projects } from './types';
import { label, text } from 'chalk-ex';
import ora from 'ora';
import { currentPath } from '../../utils/path';

axios.defaults.timeout = 20 * 1000;

function pageSearch(size: number = 5000) {
  return {
    pagination: 'keyset',
    per_page: size,
    order_by: 'id',
    sort: 'asc',
  };
}

async function fetchGroups(): Promise<groups[] | undefined> {
  const loading = ora('Fetch GitLab groups').start();

  const res = await axios
    .get<groups[]>('/groups', { params: pageSearch() })
    .catch((err) => {
      loading.stop().clear();
      console.log(label.error, err.message, err?.response?.data || '');
    });
  if (!res) {
    return;
  }
  loading.succeed();

  return res.data;
}

async function fetchGroupsProjects(groups: groups[]): Promise<projects[]> {
  function getGroupProjects(group: groups, resolve) {
    axios
      .get<groupsInfo>(`/groups/${group.id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch(() => {
        getGroupProjects(group, resolve);
      });
  }

  let count = 0;
  const total = groups.length;
  const loading = ora(`Fetch all groups projects ${count}/${total}`).start();

  const groupsInfos = await Promise.all<groupsInfo>(
    groups.map(
      (g) =>
        new Promise((resolve) =>
          getGroupProjects(g, (data) => {
            loading.text = `Fetch all groups projects ${++count}/${total}`;
            resolve(data);
          })
        )
    )
  );

  loading.succeed();

  return groupsInfos.reduce((accumulate: projects[], current) => {
    return accumulate.concat(current.projects);
  }, []);
}

async function downloadProjects(projects: projects[]) {
  function downloadZip(project: projects, resolve, n: number = 0) {
    axios
      .get<ArrayBuffer>(`/projects/${project.id}/repository/archive`, {
        responseType: 'arraybuffer',
      })
      .then((res) => {
        fsExtra.ensureDirSync(project.path_with_namespace);
        let fd = fs.openSync(
          path.resolve(
            currentPath,
            project.path_with_namespace,
            `${project.name}-master.tar.gz`
          ),
          'w'
        );
        const buf = Buffer.from(res.data);
        fs.writeSync(fd, buf);
        resolve();
      })
      .catch(() => {
        if (n < 10) {
          downloadZip(project, resolve, ++n);
        } else {
          resolve(projects);
        }
      });
  }

  let count = 0;
  const total = projects.length;
  const loading = ora(`Download projects ${count}/${total}`).start();

  const result = await Promise.all<projects | null>(
    projects.map(
      (p) =>
        new Promise((resolve) =>
          downloadZip(p, () => {
            loading.text = `Download projects ${++count}/${total}`;
            resolve(null);
          })
        )
    )
  );

  loading.succeed();

  result.forEach((item) => {
    if (item) {
      console.log(
        label.warn,
        `Fails download ${item.name} (${item.id} | ${item.path_with_namespace})`
      );
    }
  });
}

export default async function download() {
  const cache = getCache();
  // GitLab address
  const address = await prompts({
    type: 'text',
    name: 'url',
    message: 'Please enter the GitLab address(e.g. https://gitlab.com):',
    initial: cache.baseUrl,
  });
  let baseUrl = address.url;
  if (!baseUrl) {
    return;
  } else if (/^.*\/$/.test(baseUrl)) {
    baseUrl = baseUrl.replace(/\/$/, '');
  }
  // Personal Access Token
  let token = cache.token;
  if (!token || baseUrl !== cache.baseUrl) {
    const access = await prompts({
      type: 'password',
      name: 'token',
      message: 'Please enter the GitLab Personal Access Token(PAT):',
    });
    token = access.token;
    if (!token) {
      return;
    }
  }

  setCache({
    baseUrl,
    token,
  });

  axios.defaults.baseURL = `${baseUrl}/api/v4`;
  axios.defaults.headers = {
    // @ts-ignore
    'Private-Token': token,
    'X-Requested-With': 'XMLHttpRequest',
  };

  console.log(text.blue('** Starting GitLab batch download **'));

  const groups = await fetchGroups();
  if (!groups) {
    return;
  }

  const projects = await fetchGroupsProjects(groups);

  await downloadProjects(projects);

  console.log(text.green('** Download finish **'));
}
